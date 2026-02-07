module Api
  module V1
    class WebhooksController < BaseController
      # Отключаем аутентификацию для webhook endpoints
      skip_before_action :authenticate_request

      # POST /api/v1/webhooks/prodamus
      def prodamus
        result = Payments::ProcessWebhookInteractor.call(params.to_unsafe_h)

        if result.success?
          render json: { status: 'ok', message: 'Payment updated' }, status: :ok
        else
          status_code = result.code == :not_found ? :not_found : :unprocessable_entity
          render json: { status: 'error', message: result.message }, status: status_code
        end
      rescue StandardError => e
        Rails.logger.error "Webhook processing error: #{e.class.name} - #{e.message}"
        render json: { status: 'error', message: 'Internal error' }, status: :internal_server_error
      end
    end
  end
end
