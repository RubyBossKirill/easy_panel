module Api
  module V1
    class AuthController < BaseController
      skip_before_action :authenticate_request, only: %i[login register refresh]

      def login
        user = User.find_by(email: login_params[:email]&.downcase)

        if user&.authenticate(login_params[:password])
          tokens = generate_tokens(user)
          render_success(
            {
              user: UserSerializer.serialize(user, include: [:role]),
              access_token: tokens[:access_token],
              refresh_token: tokens[:refresh_token],
              expires_in: 24.hours.to_i
            }
          )
        else
          render_error(t_error('auth.invalid_credentials'), code: :invalid_credentials, status: :unauthorized)
        end
      end

      def register
        user = User.new(register_params)
        user.email = user.email.downcase if user.email

        # Назначаем роль "employee" по умолчанию
        user.role = Role.find_by(name: 'Сотрудник') || Role.first

        if user.save
          tokens = generate_tokens(user)
          render_success(
            {
              user: UserSerializer.serialize(user, include: [:role]),
              access_token: tokens[:access_token],
              refresh_token: tokens[:refresh_token],
              expires_in: 24.hours.to_i
            },
            status: :created
          )
        else
          render_validation_errors(user.errors)
        end
      end

      def refresh
        refresh_token_string = params[:refresh_token]

        if refresh_token_string.blank?
          return render_error(t_error('auth.refresh_token_required'), code: :refresh_token_required, status: :bad_request)
        end

        # Декодируем JWT токен
        payload = JsonWebToken.decode(refresh_token_string)

        if payload.nil? || !JsonWebToken.refresh_token?(payload)
          return render_error(t_error('auth.invalid_refresh_token'), code: :invalid_refresh_token, status: :unauthorized)
        end

        # Находим refresh token в БД
        refresh_token = RefreshToken.find_by(id: payload['refresh_token_id'])

        if refresh_token.nil? || !refresh_token.valid_token?
          return render_error(t_error('auth.refresh_token_expired'), code: :refresh_token_expired, status: :unauthorized)
        end

        # Отзываем старый refresh token
        refresh_token.revoke!

        # Генерируем новую пару токенов
        tokens = generate_tokens(refresh_token.user)

        render_success(
          {
            user: UserSerializer.serialize(refresh_token.user, include: [:role]),
            access_token: tokens[:access_token],
            refresh_token: tokens[:refresh_token],
            expires_in: 24.hours.to_i
          }
        )
      end

      def logout
        # Отзываем все refresh токены пользователя
        current_user.refresh_tokens.active.each(&:revoke!)

        render_success(message: t_message('success.logged_out'))
      end

      def me
        if current_user
          render_success(
            { user: UserSerializer.serialize(current_user, include: [:role]) }
          )
        else
          render_error(t_error('auth.not_authenticated'), code: :not_authenticated, status: :unauthorized)
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

      def login_params
        params.require(:user).permit(:email, :password)
      rescue ActionController::ParameterMissing
        params.permit(:email, :password)
      end

      def register_params
        params.require(:user).permit(:email, :password, :password_confirmation, :name)
      rescue ActionController::ParameterMissing
        params.permit(:email, :password, :password_confirmation, :name)
      end
    end
  end
end
