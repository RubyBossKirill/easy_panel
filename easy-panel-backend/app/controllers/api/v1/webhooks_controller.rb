module Api
  module V1
    class WebhooksController < ApplicationController
      # Отключаем CSRF проверку для webhook endpoints
      skip_before_action :verify_authenticity_token
      skip_before_action :authenticate_user!

      # POST /api/v1/webhooks/prodamus
      def prodamus
        Rails.logger.info '========================================='
        Rails.logger.info '🔔 WEBHOOK CONTROLLER: Prodamus webhook received'
        Rails.logger.info '========================================='
        Rails.logger.info "Raw params: #{params.inspect}"
        Rails.logger.info "Request body: #{request.body.read}"
        request.body.rewind

        # Проверяем webhook через сервис
        prodamus_service = ProdamusService.new
        webhook_data = prodamus_service.verify_webhook(params)

        Rails.logger.info "Обработанные данные webhook:"
        Rails.logger.info webhook_data.inspect

        # Находим Payment по appointment_id или order_id
        payment = find_payment(webhook_data)

        if payment
          Rails.logger.info "✅ Payment найден: ##{payment.id}"
          Rails.logger.info "Текущий статус: #{payment.status}"

          # Обновляем статус платежа на "paid"
          payment.mark_as_paid!

          Rails.logger.info "✅ Payment ##{payment.id} помечен как оплаченный"
          Rails.logger.info '========================================='

          render json: { status: 'ok', message: 'Payment updated' }, status: :ok
        else
          Rails.logger.error '❌ Payment не найден по данным webhook'
          Rails.logger.error "appointment_id: #{webhook_data[:appointment_id]}"
          Rails.logger.error "order_id: #{webhook_data[:order_id]}"
          Rails.logger.info '========================================='

          render json: { status: 'error', message: 'Payment not found' }, status: :not_found
        end
      rescue StandardError => e
        Rails.logger.error "❌ Ошибка обработки webhook: #{e.class.name} - #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
        Rails.logger.info '========================================='

        render json: { status: 'error', message: e.message }, status: :internal_server_error
      end

      private

      def find_payment(webhook_data)
        # Пробуем найти по appointment_id (самый надежный способ)
        if webhook_data[:appointment_id].present?
          payment = Payment.pending.find_by(appointment_id: webhook_data[:appointment_id])
          return payment if payment
        end

        # Пробуем найти по order_id (это ID платежа)
        if webhook_data[:order_id].present?
          payment = Payment.pending.find_by(id: webhook_data[:order_id])
          return payment if payment
        end

        # Пробуем найти по prodamus_order_id
        if webhook_data[:order_id].present?
          payment = Payment.pending.find_by(prodamus_order_id: webhook_data[:order_id])
          return payment if payment
        end

        nil
      end
    end
  end
end
