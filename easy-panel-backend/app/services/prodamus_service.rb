require 'net/http'
require 'uri'
require 'json'

class ProdamusService
  PAYFORM_URL = 'https://psy-center.payform.ru/'
  SYS_CODE = 'psycentr'

  def initialize
    @base_url = PAYFORM_URL
    @sys_code = SYS_CODE
  end

  # Генерация ссылки на оплату
  def generate_payment_link(appointment:, service:, client:, payment:)
    # Формируем параметры для запроса
    params = build_payment_params(appointment, service, client, payment)

    # Формируем URL с параметрами
    uri = URI.parse(@base_url)
    uri.query = URI.encode_www_form(params)

    begin
      # Отправляем GET запрос
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == 'https'
      # В development отключаем проверку SSL (CRL недоступен локально)
      http.verify_mode = Rails.env.development? ? OpenSSL::SSL::VERIFY_NONE : OpenSSL::SSL::VERIFY_PEER
      request = Net::HTTP::Get.new(uri.request_uri)
      response = http.request(request)

      if response.is_a?(Net::HTTPSuccess)
        # Парсим JSON ответ
        result = JSON.parse(response.body)

        # Prodamus возвращает поле 'payment_link', а не 'link'
        payment_link = result['payment_link'] || result['link']

        if payment_link
          return { success: true, link: payment_link }
        else
          Rails.logger.error "Prodamus: В ответе отсутствует поле 'payment_link'"
          return { success: false, error: 'No payment link in response', response: result }
        end
      else
        Rails.logger.error "Prodamus HTTP error: #{response.code} #{response.message}"
        return { success: false, error: "HTTP #{response.code}: #{response.message}" }
      end

    rescue JSON::ParserError => e
      Rails.logger.error "Prodamus JSON parse error: #{e.message}"
      return { success: false, error: "JSON parse error: #{e.message}" }
    rescue StandardError => e
      Rails.logger.error "Prodamus request error: #{e.class.name} - #{e.message}"
      return { success: false, error: e.message }
    end
  end

  # Проверка webhook от Prodamus
  def verify_webhook(params)
    # Извлекаем кастомные параметры
    appointment_id = params[:_param_appointment_id] || params['_param_appointment_id']
    client_id = params[:_param_client_id] || params['_param_client_id']
    service_id = params[:_param_service_id] || params['_param_service_id']
    order_id = params[:order_id] || params['order_id']
    payment_status = params[:payment_status] || params['payment_status']

    {
      appointment_id: appointment_id,
      client_id: client_id,
      service_id: service_id,
      order_id: order_id,
      payment_status: payment_status,
      raw_params: params
    }
  end

  private

  def build_payment_params(appointment, service, client, payment)
    # URL для webhook уведомлений
    webhook_url = if Rails.env.production?
                    'https://api.panel.bulatova-psy.ru/api/v1/webhooks/prodamus'
                  else
                    'http://localhost:5001/api/v1/webhooks/prodamus'
                  end

    {
      # Обязательные параметры
      'do' => 'link',                          # Вернуть JSON со ссылкой
      'type' => 'json',                        # Формат ответа - JSON
      'callbackType' => 'json',                # Формат callback - JSON
      'sys' => @sys_code,                      # Код магазина

      # Информация о товаре/услуге
      'products[0][name]' => service.name,
      'products[0][price]' => service.price.to_i, # Полная цена без скидки
      'products[0][quantity]' => 1,

      # Описание платежа
      'paid_content' => "Оплата услуги: #{service.name}",

      # Скидка в рублях (если есть) - Prodamus вычтет эту сумму из order_sum
      'discount_value' => payment.discount_amount.present? ? payment.discount_amount.to_i : 0,

      # ID заказа - timestamp в секундах (10 цифр) + payment_id для уникальности
      'order_id' => "#{Time.now.to_i}#{payment.id}",

      # Кастомные параметры (вернутся в webhook)
      '_param_appointment_id' => appointment.id.to_s,
      '_param_client_id' => client.id.to_s,
      '_param_service_id' => service.id.to_s,
      '_param_payment_id' => payment.id.to_s,

      # Дополнительные данные клиента (опционально)
      'customer_phone' => client.phone || '',
      'customer_email' => client.email || '',

      # Ограничение платежей
      'payments_limit' => 1,

      # URL для webhook уведомлений
      'urlNotification' => webhook_url
    }
  end
end
