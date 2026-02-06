module Api
  module V1
    class TimeSlotsController < BaseController
      before_action :authenticate_user!
      before_action :set_time_slot, only: [:show, :update, :destroy]
      before_action :check_permissions, only: [:create, :update, :destroy, :bulk_create]

      # GET /api/v1/time_slots
      def index
        @time_slots = TimeSlot.includes(:employee, :appointment)

        # Employee может видеть только свои слоты
        @time_slots = @time_slots.where(employee_id: current_user.id) unless current_user.can_view_all?

        # Фильтры
        @time_slots = @time_slots.where(employee_id: params[:employee_id]) if params[:employee_id].present?
        @time_slots = @time_slots.where(date: params[:date]) if params[:date].present?
        @time_slots = @time_slots.where('date >= ?', params[:from_date]) if params[:from_date].present?
        @time_slots = @time_slots.where('date <= ?', params[:to_date]) if params[:to_date].present?
        @time_slots = @time_slots.where(available: params[:available]) if params[:available].present?

        # Сортировка
        @time_slots = @time_slots.order(date: :asc, time: :asc)

        render_success(
          TimeSlotSerializer.serialize_collection(
            @time_slots,
            include: %i[employee appointment]
          )
        )
      end

      # GET /api/v1/time_slots/:id
      def show
        render_success(
          TimeSlotSerializer.serialize(@time_slot, include: %i[employee appointment])
        )
      end

      # POST /api/v1/time_slots
      def create
        @time_slot = TimeSlot.new(time_slot_params)

        # Если employee_id не указан, используем current_user
        @time_slot.employee_id ||= current_user.id

        if @time_slot.save
          render_success(
            TimeSlotSerializer.serialize(@time_slot, include: %i[employee]),
            status: :created
          )
        else
          render_validation_errors(@time_slot.errors)
        end
      end

      # POST /api/v1/time_slots/bulk_create
      def bulk_create
        result = TimeSlots::BulkCreateTimeSlotsInteractor.call(current_user, bulk_create_params)

        if result.success?
          slots_count = result.data.count
          slots_word = case slots_count
                       when 1 then 'слот'
                       when 2..4 then 'слота'
                       else 'слотов'
                       end

          render_success({
            message: "Создано #{slots_count} #{slots_word}",
            time_slots: TimeSlotSerializer.serialize_collection(result.data, include: %i[employee])
          }, status: :created)
        else
          render_error(result.message, code: result.code)
        end
      end

      # PATCH/PUT /api/v1/time_slots/:id
      def update
        if @time_slot.update(time_slot_params)
          render_success(
            TimeSlotSerializer.serialize(@time_slot, include: %i[employee])
          )
        else
          render_validation_errors(@time_slot.errors)
        end
      end

      # DELETE /api/v1/time_slots/:id
      def destroy
        @time_slot.destroy
        head :no_content
      end

      private

      def set_time_slot
        @time_slot = TimeSlot.includes(:employee, :appointment).find(params[:id])

        # Employee может управлять только своими слотами
        return if current_user.can_view_all? || @time_slot.employee_id == current_user.id

        render_forbidden
      rescue ActiveRecord::RecordNotFound
        render_not_found(t_error('time_slots.not_found'))
      end

      def time_slot_params
        params.require(:time_slot).permit(
          :employee_id,
          :date,
          :time,
          :duration,
          :available,
          :appointment_id
        )
      end

      def bulk_create_params
        params.permit(
          :employee_id,
          :date,
          :start_time,
          :end_time,
          :duration,
          :break_duration
        ).to_h
      end

      def check_permissions
        return if current_user.has_permission?('manage_schedule')

        render_forbidden(t_error('permissions.manage_schedule'))
      end
    end
  end
end
