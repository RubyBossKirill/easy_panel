module Users
  class UpdateUserInteractor < BaseInteractor
    # Обновление пользователя с проверками
    # @param current_user [User] текущий пользователь
    # @param user [User] пользователь для обновления
    # @param params [Hash] параметры обновления
    # @return [Result] результат с обновлённым пользователем
    def call(current_user, user, params)
      # Проверка прав через Policy
      policy = UserPolicy.new(current_user, user)
      failure!('Forbidden', :forbidden) unless policy.update?

      # Проверка изменения роли
      if params[:role_id].present? && params[:role_id] != user.role_id
        check_role_change!(current_user, user, params[:role_id], policy)
      end

      # Обновляем пользователя
      if user.update(params)
        success(user)
      else
        failure(user.errors.full_messages.join(', '), :validation_error)
      end
    end

    private

    # Проверка изменения роли
    def check_role_change!(current_user, user, new_role_id, policy)
      # Только Owner/Admin могут менять роли
      unless policy.can_change_role?
        failure!(I18n.t('errors.forbidden'), :forbidden)
      end

      new_role = find_record!(Role, new_role_id)

      # Если убираем роль Owner, проверяем что это не последний Owner
      if user.role&.is_owner && !new_role.is_owner
        unless policy.not_last_owner?
          failure!(I18n.t('errors.users.last_owner_error'), :forbidden)
        end
      end

      # Если назначаем роль Owner, только Owner может это делать
      if new_role.is_owner && !current_user.owner?
        failure!(I18n.t('errors.users.only_owner_can_assign_owner'), :forbidden)
      end
    end
  end
end
