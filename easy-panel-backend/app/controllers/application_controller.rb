class ApplicationController < ActionController::API
  include Authenticable
  before_action :authenticate_request

  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found

  private

  def record_not_found
    render json: { error: 'Запись не найдена' }, status: :not_found
  end

  # Проверка прав доступа через Policy
  # @param action [Symbol] действие (например :show?, :update?)
  # @param record [ActiveRecord::Base, nil] запись для проверки
  # @raise [StandardError] если нет прав
  def authorize!(action, record = nil)
    policy_class = policy_class_for(record)
    policy = policy_class.new(current_user, record)

    return if policy.public_send(action)

    render json: {
      status: false,
      error: 'You do not have permission to perform this action',
      code: :forbidden
    }, status: :forbidden
  end

  # Определение класса политики по записи
  # @param record [ActiveRecord::Base, nil] запись
  # @return [Class] класс политики
  def policy_class_for(record)
    if record.is_a?(Class)
      "#{record.name}Policy".constantize
    elsif record
      "#{record.class.name}Policy".constantize
    else
      BasePolicy
    end
  end
end
