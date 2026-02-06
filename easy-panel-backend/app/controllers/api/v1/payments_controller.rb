module Api
  module V1
    class PaymentsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_payment, only: [:show]
      before_action :check_permissions, only: [:create]

      # GET /api/v1/payments
      def index
        @payments = Payment.includes(:client, :appointment, :service)

        # Фильтры
        @payments = @payments.where(client_id: params[:client_id]) if params[:client_id].present?
        @payments = @payments.where(appointment_id: params[:appointment_id]) if params[:appointment_id].present?
        @payments = @payments.where(status: params[:status]) if params[:status].present?
        @payments = @payments.where('created_at >= ?', params[:from_date]) if params[:from_date].present?
        @payments = @payments.where('created_at <= ?', params[:to_date]) if params[:to_date].present?

        # Employee видит только платежи по своим записям
        unless current_user.can_view_all?
          appointment_ids = Appointment.where(employee_id: current_user.id).pluck(:id)
          @payments = @payments.where(appointment_id: appointment_ids)
        end

        # Сортировка по дате создания (последние первые)
        @payments = @payments.order(created_at: :desc)

        render json: @payments.as_json(
          include: {
            client: { only: [:id, :name, :phone, :email] },
            service: { only: [:id, :name, :price, :duration] },
            appointment: {
              only: [:id, :date, :time, :duration, :status],
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
            client: { only: [:id, :name, :phone, :email] },
            service: { only: [:id, :name, :price, :duration, :description] },
            appointment: {
              only: [:id, :date, :time, :duration, :status, :notes],
              include: {
                employee: { only: [:id, :name, :email] }
              }
            }
          }
        )
      end

      # POST /api/v1/payments - создание платежа с генерацией ссылки Prodamus
      def create
        Rails.logger.info "========================================="
        Rails.logger.info "💳 PAYMENTS CONTROLLER: Create action"
        Rails.logger.info "========================================="
        Rails.logger.info "Params: #{payment_params.inspect}"

        # Загружаем связанные объекты
        appointment = Appointment.find(payment_params[:appointment_id])
        service = Service.find(payment_params[:service_id])
        client = Client.find(payment_params[:client_id])

        Rails.logger.info "Найдены: Appointment ##{appointment.id}, Service ##{service.id}, Client ##{client.id}"

        # Создаем Payment
        @payment = Payment.new(
          client: client,
          appointment: appointment,
          service: service,
          amount: service.price,
          payment_method: payment_params[:payment_method] || 'online',
          status: 'pending',
          discount_type: payment_params[:discount_type],
          discount_value: payment_params[:discount_value]
        )

        if @payment.save
          Rails.logger.info "✅ Payment ##{@payment.id} создан успешно"

          # Если метод оплаты online - генерируем ссылку через Prodamus
          if @payment.payment_method == 'online'
            Rails.logger.info "🔗 Генерируем ссылку Prodamus для Payment ##{@payment.id}"

            prodamus = ProdamusService.new
            result = prodamus.generate_payment_link(
              appointment: appointment,
              service: service,
              client: client,
              payment: @payment
            )

            if result[:success]
              # Сохраняем ссылку и prodamus_order_id
              @payment.update!(
                payment_link: result[:link],
                prodamus_order_id: "payment_#{@payment.id}_#{Time.now.to_i}"
              )

              Rails.logger.info "✅ Ссылка сохранена в Payment ##{@payment.id}"
            else
              Rails.logger.error "❌ Ошибка генерации ссылки: #{result[:error]}"
              # Не падаем, просто возвращаем payment без ссылки
            end
          end

          render json: @payment.as_json(
            include: {
              client: { only: [:id, :name, :phone, :email] },
              service: { only: [:id, :name, :price, :duration] },
              appointment: {
                only: [:id, :date, :time, :status],
                include: {
                  employee: { only: [:id, :name, :email] }
                }
              }
            }
          ), status: :created
        else
          Rails.logger.error "❌ Ошибка создания Payment: #{@payment.errors.full_messages}"
          render json: { errors: @payment.errors.full_messages }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound => e
        Rails.logger.error "❌ Запись не найдена: #{e.message}"
        render json: { error: "Record not found: #{e.message}" }, status: :not_found
      end

      private

      def set_payment
        @payment = Payment.includes(:client, :appointment, :service).find(params[:id])

        # Employee может видеть только платежи по своим записям
        unless current_user.can_view_all?
          unless @payment.appointment&.employee_id == current_user.id
            render json: { error: 'Forbidden' }, status: :forbidden
          end
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Payment not found' }, status: :not_found
      end

      def payment_params
        params.require(:payment).permit(
          :client_id,
          :appointment_id,
          :service_id,
          :amount,
          :payment_method,
          :discount_type,
          :discount_value
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
