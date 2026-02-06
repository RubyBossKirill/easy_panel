module Users
  class CreateUserInteractor < BaseInteractor
    # Создание пользователя с проверками
    # @param current_user [User] текущий пользователь
    # @param params [Hash] параметры создания
    # @return [Result] результат с созданным пользователем
    def call(current_user, params)
      # Проверка прав через Policy
      authorize!(current_user, 'manage_users')

      # Проверка создания Owner
      if params[:role_id].present?
        check_owner_creation!(current_user, params[:role_id])
      end

      # Создаём пользователя
      user = User.new(params)

      if user.save
        success(user)
      else
        failure(user.errors.full_messages.join(', '), :validation_error)
      end
    end

    private

    # Проверка создания пользователя с ролью Owner
    def check_owner_creation!(current_user, role_id)
      role = find_record!(Role, role_id)

      # Только Owner может создать Owner
      if role.is_owner && !current_user.owner?
        failure!(I18n.t('errors.users.only_owner_can_create_owner'), :forbidden)
      end
    end
  end
end
