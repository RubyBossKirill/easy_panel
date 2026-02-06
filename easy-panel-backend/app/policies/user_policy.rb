class UserPolicy < BasePolicy
  # Просмотр списка пользователей
  def index?
    has_permission?('view_users')
  end

  # Просмотр профиля пользователя
  def show?
    return true if record.id == user.id # Свой профиль
    return true if can_view_all? # Owner/Admin видят всех

    # Employee видит только себя
    false
  end

  # Создание пользователя
  def create?
    has_permission?('manage_users')
  end

  # Редактирование пользователя
  def update?
    return true if record.id == user.id # Свой профиль (ограниченно)
    return true if can_manage_all? # Owner/Admin могут редактировать всех

    false
  end

  # Удаление пользователя
  def destroy?
    return false if record.id == user.id # Нельзя удалить себя

    can_manage_all?
  end

  # Проверка создания Owner (только Owner может создать Owner)
  def can_create_owner?
    owner?
  end

  # Проверка редактирования роли
  def can_change_role?
    return false if record.id == user.id # Нельзя менять свою роль

    can_manage_all?
  end

  # Проверка что это не последний Owner
  def not_last_owner?
    return true unless record.role&.is_owner

    # Если удаляем/изменяем Owner, проверяем что это не последний
    User.joins(:role).where(roles: { is_owner: true }).count > 1
  end
end
