module Payments
  class ProcessWebhookInteractor < BaseInteractor
    # Обработка webhook от Prodamus
    # @param params [Hash] параметры webhook
    # @return [Result] результат с обновлённым платежом
    def call(params)
      # Парсим данные webhook через ProdamusService
      webhook_data = parse_webhook_data(params)

      # Находим платёж
      payment = find_payment(webhook_data)
      failure!('Payment not found', :not_found) unless payment

      # Обновляем статус платежа
      update_payment_status(payment, webhook_data[:payment_status])

      success(payment)
    end

    private

    # Парсинг данных webhook
    def parse_webhook_data(params)
      prodamus = ProdamusService.new
      prodamus.verify_webhook(params)
    end

    # Поиск платежа по данным webhook
    def find_payment(webhook_data)
      payment_id = webhook_data[:raw_params][:_param_payment_id] ||
                   webhook_data[:raw_params]['_param_payment_id']

      return Payment.find_by(id: payment_id) if payment_id.present?

      # Альтернативный поиск по appointment_id
      appointment_id = webhook_data[:appointment_id]
      return nil unless appointment_id.present?

      appointment = Appointment.find_by(id: appointment_id)
      appointment&.payment
    end

    # Обновление статуса платежа
    def update_payment_status(payment, payment_status)
      case payment_status
      when 'success', 'paid'
        payment.mark_as_paid! unless payment.paid?
      when 'cancel', 'cancelled'
        payment.mark_as_cancelled! unless payment.cancelled?
      when 'fail', 'failed'
        payment.mark_as_failed! unless payment.failed?
      else
        Rails.logger.warn "Unknown payment status: #{payment_status}"
      end
    end
  end
end
