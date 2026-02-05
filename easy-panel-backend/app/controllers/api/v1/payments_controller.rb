module Api
  module V1
    class PaymentsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_payment, only: [:show]
      before_action :check_permissions, only: [:create]

      # GET /api/v1/payments
      def index
        @payments = Payment.includes(:client, :appointment)

        # Фильтры
        @payments = @payments.where(client_id: params[:client_id]) if params[:client_id].present?
        @payments = @payments.where(appointment_id: params[:appointment_id]) if params[:appointment_id].present?
        @payments = @payments.where(employee_id: params[:employee_id]) if params[:employee_id].present?
        @payments = @payments.where('paid_at >= ?', params[:from_date]) if params[:from_date].present?
        @payments = @payments.where('paid_at <= ?', params[:to_date]) if params[:to_date].present?

        # Employee видит только платежи по своим записям
        unless current_user.has_role?(:owner) || current_user.has_role?(:admin)
          @payments = @payments.where(employee_id: current_user.id)
        end

        # Сортировка по дате платежа (последние первые)
        @payments = @payments.order(paid_at: :desc)

        render json: @payments.as_json(
          include: {
            client: { only: [:id, :name, :phone, :email] },
            appointment: {
              only: [:id, :date, :time, :duration, :status, :service],
              include: {
                employee: { only: [:id, :name, :email] }
              }
            }
          }
        )
      end

      # GET /api/v1/payments/:id
      def show
        render json: @payment.as_json(
          include: {
            client: { only: [:id, :name, :phone, :email, :telegram] },
            appointment: {
              only: [:id, :date, :time, :duration, :status, :service, :notes],
              include: {
                employee: { only: [:id, :name, :email] }
              }
            }
          }
        )
      end

      # POST /api/v1/payments
      def create
        @payment = Payment.new(payment_params)

        # Устанавливаем employee_id из appointment, если не указан
        if @payment.appointment_id.present?
          appointment = Appointment.find_by(id: @payment.appointment_id)
          @payment.employee_id ||= appointment&.employee_id
        end

        # Устанавливаем paid_at на текущее время, если не указано
        @payment.paid_at ||= Time.current

        if @payment.save
          render json: @payment.as_json(
            include: {
              client: { only: [:id, :name, :phone, :email] },
              appointment: {
                only: [:id, :date, :time, :status, :service],
                include: {
                  employee: { only: [:id, :name, :email] }
                }
              }
            }
          ), status: :created
        else
          render json: { errors: @payment.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def set_payment
        @payment = Payment.includes(:client, :appointment).find(params[:id])

        # Employee может видеть только платежи по своим записям
        unless current_user.has_role?(:owner) || current_user.has_role?(:admin) || @payment.employee_id == current_user.id
          render json: { error: 'Forbidden' }, status: :forbidden
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Payment not found' }, status: :not_found
      end

      def payment_params
        params.require(:payment).permit(
          :client_id,
          :appointment_id,
          :amount,
          :service,
          :employee_id,
          :paid_at
        )
      end

      def check_permissions
        unless current_user.has_permission?('manage_payments')
          render json: { error: 'You do not have permission to perform this action' }, status: :forbidden
        end
      end
    end
  end
end
