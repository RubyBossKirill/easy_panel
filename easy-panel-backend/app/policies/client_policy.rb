class ClientPolicy < BasePolicy
  # Просмотр списка клиентов
  def index?
    has_permission?('view_clients')
  end

  # Просмотр профиля клиента
  def show?
    return true if can_view_all? # Owner/Admin видят всех
    return true if owner_of_record? # Employee видит своих клиентов

    false
  end

  # Создание клиента
  def create?
    has_permission?('manage_clients')
  end

  # Редактирование клиента
  def update?
    return true if can_manage_all? # Owner/Admin могут редактировать всех
    return true if owner_of_record? # Employee может редактировать своих

    false
  end

  # Удаление клиента
  def destroy?
    return true if can_manage_all? # Owner/Admin могут удалять всех
    return true if owner_of_record? && no_appointments? # Employee может удалить своего клиента без встреч

    false
  end

  private

  # Проверка что у клиента нет встреч
  def no_appointments?
    record.appointments.count.zero?
  end
end
