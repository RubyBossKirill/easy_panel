module Api
  module V1
    class AppointmentsController < BaseController
      before_action :authenticate_user!
      before_action :set_appointment, only: [:show, :update, :destroy, :update_status]
      before_action :check_permissions, only: [:create, :update, :destroy]

      # GET /api/v1/appointments
      def index
        @appointments = Appointment.includes(:client, :employee, :service)

        # Фильтрация по сотруднику (если не может видеть все - видит только свои)
        @appointments = @appointments.for_employee(current_user.id) unless current_user.can_view_all?

        # Фильтры
        @appointments = @appointments.by_status(params[:status]) if params[:status].present?
        @appointments = @appointments.for_employee(params[:employee_id]) if params[:employee_id].present?
        @appointments = @appointments.where(client_id: params[:client_id]) if params[:client_id].present?
        @appointments = @appointments.where('date >= ?', params[:from_date]) if params[:from_date].present?
        @appointments = @appointments.where('date <= ?', params[:to_date]) if params[:to_date].present?

        # Сортировка
        @appointments = @appointments.order(date: :asc, time: :asc)

        render_success(
          AppointmentSerializer.serialize_collection(
            @appointments,
            include: %i[client employee service]
          )
        )
      end

      # GET /api/v1/appointments/:id
      def show
        render_success(
          AppointmentSerializer.serialize(@appointment, include: %i[client employee time_slot])
        )
      end

      # POST /api/v1/appointments
      def create
        result = Appointments::CreateAppointmentInteractor.call(current_user, appointment_params.to_h)

        if result.success?
          render_success(
            AppointmentSerializer.serialize(result.data, include: %i[client employee]),
            message: result.message,
            status: :created
          )
        else
          render_error(result.message, code: result.code)
        end
      end

      # PATCH/PUT /api/v1/appointments/:id
      def update
        if @appointment.update(appointment_params)
          render_success(
            AppointmentSerializer.serialize(@appointment, include: %i[client employee])
          )
        else
          render_validation_errors(@appointment.errors)
        end
      end

      # DELETE /api/v1/appointments/:id
      def destroy
        ActiveRecord::Base.transaction do
          # Освобождаем связанный time_slot если есть
          if @appointment.time_slot_id.present?
            time_slot = TimeSlot.find_by(id: @appointment.time_slot_id)
            time_slot&.update!(available: true, appointment_id: nil)
          end

          # Также освобождаем все time_slots которые ссылаются на эту встречу
          TimeSlot.where(appointment_id: @appointment.id).update_all(available: true, appointment_id: nil)

          @appointment.destroy!
        end
        head :no_content
      rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotDestroyed => e
        render_error(e.message, code: :validation_error)
      rescue ActiveRecord::InvalidForeignKey
        render_error('Невозможно удалить запись: существуют связанные данные', code: :unprocessable_entity)
      end

      # PATCH /api/v1/appointments/:id/update_status
      def update_status
        new_status = params[:status]

        # Разрешённые статусы: nil (для сброса), 'completed', 'cancelled'
        allowed_statuses = [nil, 'completed', 'cancelled']
        unless allowed_statuses.include?(new_status)
          return render_error(I18n.t('errors.appointments.invalid_status'), code: :invalid_status)
        end

        if @appointment.update(status: new_status)
          render_success(
            AppointmentSerializer.serialize(@appointment, include: %i[client employee]),
            I18n.t('success.appointments.updated')
          )
        else
          render_validation_errors(@appointment.errors)
        end
      end

      private

      def set_appointment
        @appointment = Appointment.includes(:client, :employee).find(params[:id])

        # Employee может видеть только свои записи
        return if current_user.can_view_all? || @appointment.employee_id == current_user.id

        render_forbidden
      rescue ActiveRecord::RecordNotFound
        render_not_found(t_error('appointments.not_found'))
      end

      def appointment_params
        params.require(:appointment).permit(
          :client_id,
          :employee_id,
          :date,
          :time,
          :duration,
          :service_id,
          :status,
          :notes,
          :time_slot_id
        )
      end

      def check_permissions
        return if current_user.has_permission?('manage_schedule')

        render_forbidden(t_error('permissions.manage_schedule'))
      end
    end
  end
end
