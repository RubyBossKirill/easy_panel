module Payments
  class CreatePaymentInteractor < BaseInteractor
    # Создание платежа с генерацией ссылки Prodamus
    # @param current_user [User] текущий пользователь
    # @param params [Hash] параметры платежа
    # @return [Result] результат с созданным платежом
    def call(current_user, params)
      authorize!(current_user, 'manage_payments')

      # Загружаем связанные объекты
      appointment = find_record!(Appointment, params[:appointment_id])
      service = find_record!(Service, params[:service_id])
      client = find_record!(Client, params[:client_id])

      # Создаём платёж
      payment = build_payment(appointment, service, client, params)
      save_record!(payment)

      # Генерируем ссылку Prodamus если метод оплаты online
      if payment.payment_method == 'online'
        generate_prodamus_link(payment, appointment, service, client)
      end

      success(payment, I18n.t('success.payments.created'))
    end

    private

    # Построение объекта платежа
    def build_payment(appointment, service, client, params)
      Payment.new(
        client: client,
        appointment: appointment,
        service: service,
        amount: service.price,
        payment_method: params[:payment_method] || 'online',
        status: 'pending',
        discount_type: params[:discount_type],
        discount_value: params[:discount_value]
      )
    end

    # Генерация ссылки на оплату через Prodamus
    def generate_prodamus_link(payment, appointment, service, client)
      prodamus = ProdamusService.new
      result = prodamus.generate_payment_link(
        appointment: appointment,
        service: service,
        client: client,
        payment: payment
      )

      if result[:success]
        # Сохраняем ссылку
        payment.update!(
          payment_link: result[:link],
          prodamus_order_id: "payment_#{payment.id}_#{Time.now.to_i}"
        )
      else
        Rails.logger.error "Failed to generate Prodamus link: #{result[:error]}"
        # Не прерываем выполнение, платёж создан без ссылки
      end
    end
  end
end
