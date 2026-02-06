class PaymentPolicy < BasePolicy
  # Просмотр списка платежей
  def index?
    has_permission?('view_payments')
  end

  # Просмотр платежа
  def show?
    return true if can_view_all? # Owner/Admin видят все
    return true if belongs_to_appointment_owner? # Employee видит платежи по своим встречам

    false
  end

  # Создание платежа
  def create?
    has_permission?('manage_payments')
  end

  # Обновление платежа (обычно только через webhook)
  def update?
    can_manage_all?
  end

  # Удаление платежа
  def destroy?
    return false if record.status == 'paid' # Нельзя удалить оплаченный

    can_manage_all?
  end

  private

  # Проверка что платёж по встрече пользователя
  def belongs_to_appointment_owner?
    return false unless record.appointment

    record.appointment.employee_id == user&.id
  end
end
