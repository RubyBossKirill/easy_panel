class JsonWebToken
  SECRET_KEY = Rails.application.credentials.secret_key_base || Rails.application.secret_key_base
  ACCESS_TOKEN_EXPIRATION = 24.hours
  REFRESH_TOKEN_EXPIRATION = 30.days

  # Генерация access token (короткоживущий)
  def self.encode_access_token(user_id)
    payload = {
      user_id: user_id,
      type: 'access',
      exp: ACCESS_TOKEN_EXPIRATION.from_now.to_i,
      iat: Time.current.to_i
    }
    JWT.encode(payload, SECRET_KEY)
  end

  # Генерация refresh token (долгоживущий) - только ID, сам токен в БД
  def self.encode_refresh_token(refresh_token_id)
    payload = {
      refresh_token_id: refresh_token_id,
      type: 'refresh',
      exp: REFRESH_TOKEN_EXPIRATION.from_now.to_i,
      iat: Time.current.to_i
    }
    JWT.encode(payload, SECRET_KEY)
  end

  # Декодирование любого токена
  def self.decode(token)
    decoded = JWT.decode(token, SECRET_KEY)[0]
    HashWithIndifferentAccess.new(decoded)
  rescue JWT::DecodeError, JWT::ExpiredSignature => e
    Rails.logger.error("JWT decode error: #{e.message}")
    nil
  end

  # Проверка типа токена
  def self.access_token?(payload)
    payload&.dig('type') == 'access'
  end

  def self.refresh_token?(payload)
    payload&.dig('type') == 'refresh'
  end

  # Legacy метод для обратной совместимости
  def self.encode(payload, exp = ACCESS_TOKEN_EXPIRATION.from_now)
    payload[:exp] = exp.to_i
    JWT.encode(payload, SECRET_KEY)
  end
end
