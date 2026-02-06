class BasePolicy
  attr_reader :user, :record

  def initialize(user, record = nil)
    @user = user
    @record = record
  end

  # Проверка прав доступа
  # @param permission [String] название разрешения
  # @return [Boolean] true если есть права
  def has_permission?(permission)
    user&.has_permission?(permission)
  end

  # Проверка роли Owner
  # @return [Boolean] true если пользователь Owner
  def owner?
    user&.owner?
  end

  # Проверка прав на просмотр всех записей
  # @return [Boolean] true если может видеть все
  def can_view_all?
    user&.can_view_all?
  end

  # Проверка прав на управление всеми записями
  # @return [Boolean] true если может управлять всеми
  def can_manage_all?
    user&.can_manage_all?
  end

  # Проверка владения записью
  # @return [Boolean] true если пользователь создал запись
  def owner_of_record?
    return false unless record.respond_to?(:creator_id)
    record.creator_id == user&.id
  end

  # Проверка что запись принадлежит пользователю (employee_id)
  # @return [Boolean] true если запись принадлежит пользователю
  def belongs_to_user?
    return false unless record.respond_to?(:employee_id)
    record.employee_id == user&.id
  end

  # Базовые методы (переопределяются в наследниках)
  def index?
    false
  end

  def show?
    false
  end

  def create?
    false
  end

  def update?
    false
  end

  def destroy?
    false
  end
end
