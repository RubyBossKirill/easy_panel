module Api
  module V1
    class AppointmentsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_appointment, only: [:show, :update, :destroy, :update_status]
      before_action :check_permissions, only: [:create, :update, :destroy]

      # GET /api/v1/appointments
      def index
        @appointments = Appointment.includes(:client, :employee)

        # Фильтрация по сотруднику (если не может видеть все - видит только свои)
        unless current_user.can_view_all?
          @appointments = @appointments.for_employee(current_user.id)
        end

        # Фильтры
        @appointments = @appointments.by_status(params[:status]) if params[:status].present?
        @appointments = @appointments.for_employee(params[:employee_id]) if params[:employee_id].present?
        @appointments = @appointments.where(client_id: params[:client_id]) if params[:client_id].present?
        @appointments = @appointments.where('date >= ?', params[:from_date]) if params[:from_date].present?
        @appointments = @appointments.where('date <= ?', params[:to_date]) if params[:to_date].present?

        # Сортировка
        @appointments = @appointments.order(date: :asc, time: :asc)

        render json: @appointments.as_json(
          include: {
            client: { only: [:id, :name, :phone, :email] },
            employee: { only: [:id, :name, :email] },
            service: { only: [:id, :name, :price, :duration] }
          }
        )
      end

      # GET /api/v1/appointments/:id
      def show
        render json: @appointment.as_json(
          include: {
            client: { only: [:id, :name, :phone, :email, :telegram] },
            employee: { only: [:id, :name, :email] },
            time_slot: { only: [:id, :start_time, :end_time, :date] }
          }
        )
      end

      # POST /api/v1/appointments
      def create
        @appointment = Appointment.new(appointment_params)

        # Если employee_id не указан, используем current_user
        @appointment.employee_id ||= current_user.id

        ActiveRecord::Base.transaction do
          if @appointment.save
            # Если указан time_slot_id, обновляем слот
            if @appointment.time_slot_id.present?
              time_slot = TimeSlot.find(@appointment.time_slot_id)
              time_slot.update!(available: false, appointment_id: @appointment.id)
            end

            render json: @appointment.as_json(
              include: {
                client: { only: [:id, :name, :phone, :email] },
                employee: { only: [:id, :name, :email] }
              }
            ), status: :created
          else
            render json: { errors: @appointment.errors.full_messages }, status: :unprocessable_entity
          end
        end
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: [e.message] }, status: :unprocessable_entity
      end

      # PATCH/PUT /api/v1/appointments/:id
      def update
        if @appointment.update(appointment_params)
          render json: @appointment.as_json(
            include: {
              client: { only: [:id, :name, :phone, :email] },
              employee: { only: [:id, :name, :email] }
            }
          )
        else
          render json: { errors: @appointment.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/appointments/:id
      def destroy
        ActiveRecord::Base.transaction do
          # Если есть связанный time_slot, освобождаем его
          if @appointment.time_slot_id.present?
            time_slot = TimeSlot.find(@appointment.time_slot_id)
            time_slot.update!(available: true, appointment_id: nil)
          end

          @appointment.destroy
        end
        head :no_content
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: [e.message] }, status: :unprocessable_entity
      end

      # PATCH /api/v1/appointments/:id/update_status
      def update_status
        new_status = params[:status]

        unless %w[pending confirmed cancelled completed].include?(new_status)
          return render json: { error: 'Invalid status' }, status: :unprocessable_entity
        end

        if @appointment.update(status: new_status)
          render json: @appointment.as_json(
            include: {
              client: { only: [:id, :name, :phone, :email] },
              employee: { only: [:id, :name, :email] }
            }
          )
        else
          render json: { errors: @appointment.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def set_appointment
        @appointment = Appointment.includes(:client, :employee).find(params[:id])

        # Employee может видеть только свои записи
        unless current_user.can_view_all? || @appointment.employee_id == current_user.id
          render json: { error: 'Forbidden' }, status: :forbidden
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Appointment not found' }, status: :not_found
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
        unless current_user.has_permission?('manage_schedule')
          render json: { error: 'You do not have permission to perform this action' }, status: :forbidden
        end
      end
    end
  end
end
