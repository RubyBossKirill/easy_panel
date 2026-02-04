class Api::V1::AuthController < ApplicationController
  skip_before_action :authenticate_request, only: %i[login register refresh]

  def login
    user = User.find_by(email: params[:email]&.downcase)

    if user&.authenticate(params[:password])
      tokens = generate_tokens(user)
      render json: {
        status: true,
        data: {
          user: user_response(user),
          access_token: tokens[:access_token],
          refresh_token: tokens[:refresh_token],
          expires_in: 24.hours.to_i
        }
      }, status: :ok
    else
      render json: {
        status: false,
        error: 'Неверный email или пароль',
        code: 'AUTH_INVALID_CREDENTIALS'
      }, status: :unauthorized
    end
  end

  def register
    user = User.new(register_params)
    user.email = user.email.downcase if user.email

    # Назначаем роль "employee" по умолчанию
    user.role = Role.find_by(name: 'Сотрудник') || Role.first

    if user.save
      tokens = generate_tokens(user)
      render json: {
        status: true,
        data: {
          user: user_response(user),
          access_token: tokens[:access_token],
          refresh_token: tokens[:refresh_token],
          expires_in: 24.hours.to_i
        }
      }, status: :created
    else
      render json: {
        status: false,
        error: user.errors.full_messages.join(', '),
        code: 'AUTH_VALIDATION_ERROR'
      }, status: :unprocessable_entity
    end
  end

  def refresh
    refresh_token_string = params[:refresh_token]

    if refresh_token_string.blank?
      return render json: {
        status: false,
        error: 'Refresh token не предоставлен',
        code: 'AUTH_REFRESH_TOKEN_REQUIRED'
      }, status: :bad_request
    end

    # Декодируем JWT токен
    payload = JsonWebToken.decode(refresh_token_string)

    if payload.nil? || !JsonWebToken.refresh_token?(payload)
      return render json: {
        status: false,
        error: 'Невалидный refresh token',
        code: 'AUTH_INVALID_REFRESH_TOKEN'
      }, status: :unauthorized
    end

    # Находим refresh token в БД
    refresh_token = RefreshToken.find_by(id: payload['refresh_token_id'])

    if refresh_token.nil? || !refresh_token.valid_token?
      return render json: {
        status: false,
        error: 'Refresh token истек или отозван',
        code: 'AUTH_REFRESH_TOKEN_EXPIRED'
      }, status: :unauthorized
    end

    # Отзываем старый refresh token
    refresh_token.revoke!

    # Генерируем новую пару токенов
    tokens = generate_tokens(refresh_token.user)

    render json: {
      status: true,
      data: {
        user: user_response(refresh_token.user),
        access_token: tokens[:access_token],
        refresh_token: tokens[:refresh_token],
        expires_in: 24.hours.to_i
      }
    }, status: :ok
  end

  def logout
    # Отзываем все refresh токены пользователя
    current_user.refresh_tokens.active.each(&:revoke!)

    render json: {
      status: true,
      message: 'Выход выполнен успешно'
    }, status: :ok
  end

  def me
    if current_user
      render json: {
        status: true,
        data: { user: user_response(current_user) }
      }
    else
      render json: {
        status: false,
        error: 'Не авторизован',
        code: 'AUTH_NOT_AUTHENTICATED'
      }, status: :unauthorized
    end
  end

  private

  def generate_tokens(user)
    # Создаем refresh token в БД
    refresh_token = RefreshToken.generate_for_user(
      user,
      device_info: request.user_agent,
      ip_address: request.remote_ip
    )

    # Генерируем JWT токены
    {
      access_token: JsonWebToken.encode_access_token(user.id),
      refresh_token: JsonWebToken.encode_refresh_token(refresh_token.id)
    }
  end

  def register_params
    params.require(:user).permit(:email, :password, :password_confirmation, :name)
  rescue ActionController::ParameterMissing
    params.permit(:email, :password, :password_confirmation, :name)
  end

  def user_response(user)
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role_id: user.role_id,
      role: {
        id: user.role.id,
        name: user.role.name,
        permissions: user.role.permissions
      }
    }
  end
end
