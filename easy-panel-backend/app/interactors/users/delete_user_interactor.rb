module Users
  class DeleteUserInteractor < BaseInteractor
    # Удаление пользователя с проверками
    # @param current_user [User] текущий пользователь
    # @param user [User] пользователь для удаления
    # @return [Result] результат удаления
    def call(current_user, user)
      # Проверка прав через Policy
      policy = UserPolicy.new(current_user, user)
      failure!(I18n.t('errors.forbidden'), :forbidden) unless policy.destroy?

      # Нельзя удалить себя
      if user.id == current_user.id
        failure!(I18n.t('errors.users.cannot_delete_self'), :forbidden)
      end

      # Проверка что это не последний Owner
      unless policy.not_last_owner?
        failure!(I18n.t('errors.users.last_owner_error'), :forbidden)
      end

      # Проверка зависимостей
      check_dependencies!(user)

      # Удаляем пользователя
      user.destroy!

      success
    end

    private

    # Проверка зависимостей перед удалением
    def check_dependencies!(user)
      # Проверяем клиентов
      if user.clients.exists?
        failure!(
          I18n.t('errors.users.has_dependencies'),
          :unprocessable_entity
        )
      end

      # Проверяем встречи
      if user.appointments.exists?
        failure!(
          I18n.t('errors.users.has_dependencies'),
          :unprocessable_entity
        )
      end

      # Проверяем услуги
      if user.services.exists?
        failure!(
          I18n.t('errors.users.has_dependencies'),
          :unprocessable_entity
        )
      end
    end
  end
end
