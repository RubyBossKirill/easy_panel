module Api
  module V1
    class PaymentsController < BaseController
      before_action :authenticate_user!
      before_action :set_payment, only: [:show]

      # GET /api/v1/payments
      def index
        payments = Payment.includes(:client, :appointment, :service)

        # Фильтрация
        payments = apply_filters(payments)

        # Employee видит только платежи по своим записям
        unless current_user.can_view_all?
          appointment_ids = Appointment.where(employee_id: current_user.id).pluck(:id)
          payments = payments.where(appointment_id: appointment_ids)
        end

        # Сортировка и пагинация
        payments = payments.order(created_at: :desc).page(params[:page]).per(params[:per_page] || 20)

        render_success({
          payments: PaymentSerializer.serialize_collection(payments, include: [:client, :service, :appointment]),
          pagination: pagination_meta(payments)
        })
      end

      # GET /api/v1/payments/:id
      def show
        authorize!(:show?, @payment)

        render_success(
          PaymentSerializer.serialize(@payment, include: [:client, :service, :appointment])
        )
      end

      # POST /api/v1/payments
      def create
        result = Payments::CreatePaymentInteractor.call(current_user, payment_params.to_h)

        if result.success?
          render_success(
            PaymentSerializer.serialize(result.data, include: [:client, :service, :appointment]),
            status: :created
          )
        else
          render_error(result.message, code: result.code)
        end
      end

      private

      def set_payment
        @payment = Payment.includes(:client, :appointment, :service).find(params[:id])

        # Employee может видеть только платежи по своим записям
        unless current_user.can_view_all?
          unless @payment.appointment&.employee_id == current_user.id
            render_forbidden
          end
        end
      rescue ActiveRecord::RecordNotFound
        render_not_found('Payment')
      end

      def payment_params
        params.require(:payment).permit(
          :client_id,
          :appointment_id,
          :service_id,
          :payment_method,
          :discount_type,
          :discount_value
        )
      end

      def apply_filters(payments)
        payments = payments.where(client_id: params[:client_id]) if params[:client_id].present?
        payments = payments.where(appointment_id: params[:appointment_id]) if params[:appointment_id].present?
        payments = payments.where(status: params[:status]) if params[:status].present?
        payments = payments.where('created_at >= ?', params[:from_date]) if params[:from_date].present?
        payments = payments.where('created_at <= ?', params[:to_date]) if params[:to_date].present?
        payments
      end
    end
  end
end
