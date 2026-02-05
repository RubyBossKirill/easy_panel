module Api
  module V1
    class TimeSlotsController < ApplicationController
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

        render json: @time_slots.as_json(
          include: {
            employee: { only: [:id, :name, :email] },
            appointment: {
              only: [:id, :status, :service],
              include: {
                client: { only: [:id, :name, :phone, :email] }
              }
            }
          }
        )
      end

      # GET /api/v1/time_slots/:id
      def show
        render json: @time_slot.as_json(
          include: {
            employee: { only: [:id, :name, :email] },
            appointment: {
              only: [:id, :date, :time, :duration, :status, :service, :notes],
              include: {
                client: { only: [:id, :name, :phone, :email, :telegram] }
              }
            }
          }
        )
      end

      # POST /api/v1/time_slots
      def create
        @time_slot = TimeSlot.new(time_slot_params)

        # Если employee_id не указан, используем current_user
        @time_slot.employee_id ||= current_user.id

        if @time_slot.save
          render json: @time_slot.as_json(
            include: {
              employee: { only: [:id, :name, :email] }
            }
          ), status: :created
        else
          render json: { errors: @time_slot.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/time_slots/bulk_create
      def bulk_create
        employee_id = params[:employee_id] || current_user.id
        date = params[:date]
        start_time = params[:start_time]
        end_time = params[:end_time]
        duration = params[:duration]&.to_i || 60
        break_duration = params[:break_duration]&.to_i || 0

        # Валидация
        unless date.present? && start_time.present? && end_time.present?
          return render json: { error: 'Missing required parameters: date, start_time, end_time' },
                        status: :unprocessable_entity
        end

        begin
          created_slots = []
          current_time = Time.parse(start_time)
          end_time_obj = Time.parse(end_time)

          while current_time < end_time_obj
            # Создаем слот
            time_slot = TimeSlot.new(
              employee_id: employee_id,
              date: date,
              time: current_time.strftime('%H:%M'),
              duration: duration,
              available: true
            )

            if time_slot.save
              created_slots << time_slot
            else
              # Если слот уже существует или не валиден, пропускаем
              Rails.logger.warn("Failed to create time slot: #{time_slot.errors.full_messages}")
            end

            # Переходим к следующему слоту (duration + break_duration)
            current_time += (duration + break_duration).minutes
          end

          if created_slots.any?
            slots_word = case created_slots.count
                         when 1 then 'слот'
                         when 2..4 then 'слота'
                         else 'слотов'
                         end
            render json: {
              message: "Создано #{created_slots.count} #{slots_word}",
              time_slots: created_slots.as_json(
                include: {
                  employee: { only: [:id, :name, :email] }
                }
              )
            }, status: :created
          else
            render json: { error: 'Не удалось создать слоты' }, status: :unprocessable_entity
          end

        rescue ArgumentError => e
          render json: { error: "Invalid time format: #{e.message}" }, status: :unprocessable_entity
        end
      end

      # PATCH/PUT /api/v1/time_slots/:id
      def update
        if @time_slot.update(time_slot_params)
          render json: @time_slot.as_json(
            include: {
              employee: { only: [:id, :name, :email] }
            }
          )
        else
          render json: { errors: @time_slot.errors.full_messages }, status: :unprocessable_entity
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
        unless current_user.can_view_all? || @time_slot.employee_id == current_user.id
          render json: { error: 'Forbidden' }, status: :forbidden
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Time slot not found' }, status: :not_found
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

      def check_permissions
        unless current_user.has_permission?('manage_schedule')
          render json: { error: 'You do not have permission to perform this action' }, status: :forbidden
        end
      end
    end
  end
end
