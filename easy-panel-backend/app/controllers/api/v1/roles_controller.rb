class Api::V1::RolesController < ApplicationController
  before_action :authenticate_user!
  before_action :check_manage_roles_permission, only: [:create, :update, :destroy]

  # GET /api/v1/roles
  def index
    roles = Role.all.order(:id)

    render json: {
      status: true,
      data: {
        roles: roles.as_json(methods: [:is_owner])
      }
    }
  end

  # GET /api/v1/roles/:id
  def show
    role = Role.find(params[:id])

    render json: {
      status: true,
      data: {
        role: role.as_json(methods: [:is_owner])
      }
    }
  rescue ActiveRecord::RecordNotFound
    render json: { status: false, error: 'Роль не найдена' }, status: :not_found
  end

  private

  def check_manage_roles_permission
    unless current_user.has_permission?('manage_roles')
      render json: { status: false, error: 'Недостаточно прав для управления ролями' }, status: :forbidden
    end
  end
end
