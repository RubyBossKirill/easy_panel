class AppointmentPolicy < BasePolicy
  # Просмотр списка встреч
  def index?
    has_permission?('view_appointments')
  end

  # Просмотр встречи
  def show?
    return true if can_view_all? # Owner/Admin видят все
    return true if belongs_to_user? # Employee видит свои встречи

    false
  end

  # Создание встречи
  def create?
    has_permission?('manage_appointments')
  end

  # Редактирование встречи
  def update?
    return true if can_manage_all? # Owner/Admin могут редактировать все
    return true if belongs_to_user? # Employee может редактировать свои

    false
  end

  # Удаление встречи
  def destroy?
    return true if can_manage_all? # Owner/Admin могут удалять все
    return true if belongs_to_user? && no_payment? # Employee может удалить свою встречу без оплаты

    false
  end

  # Изменение статуса встречи
  def update_status?
    update?
  end

  private

  # Проверка что у встречи нет оплаты
  def no_payment?
    record.payment.nil? || record.payment.status == 'cancelled'
  end
end
