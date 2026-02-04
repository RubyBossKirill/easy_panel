class ApplicationController < ActionController::API
  include Authenticable
  before_action :authenticate_request

  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found

  private

  def record_not_found
    render json: { error: 'Запись не найдена' }, status: :not_found
  end
end
