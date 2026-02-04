module Authenticable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_request
    attr_reader :current_user
  end

  private

  def authenticate_request
    header = request.headers['Authorization']
    token = header.split(' ').last if header

    if token.blank?
      return render_unauthorized('Токен не предоставлен')
    end

    begin
      decoded = JsonWebToken.decode(token)

      if decoded.nil?
        return render_unauthorized('Невалидный токен')
      end

      # Проверяем что это access token
      unless JsonWebToken.access_token?(decoded)
        return render_unauthorized('Требуется access token')
      end

      @current_user = User.includes(:role).find(decoded[:user_id])
    rescue ActiveRecord::RecordNotFound
      render_unauthorized('Пользователь не найден')
    rescue StandardError => e
      Rails.logger.error("Authentication error: #{e.message}")
      render_unauthorized('Ошибка аутентификации')
    end
  end

  def authenticate_user!
    render_unauthorized unless current_user
  end

  def authorize_permission!(permission)
    unless current_user&.has_permission?(permission)
      render json: { error: 'Недостаточно прав' }, status: :forbidden
    end
  end

  def render_unauthorized(message = 'Требуется авторизация')
    render json: { error: message }, status: :unauthorized
  end
end
