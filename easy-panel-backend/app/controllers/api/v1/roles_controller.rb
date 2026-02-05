class Api::V1::RolesController < ApplicationController
  before_action :authenticate_user!
  before_action :check_manage_roles_permission, only: [:create, :update, :destroy]
  before_action :prevent_owner_modification, only: [:update, :destroy]

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

  # POST /api/v1/roles
  def create
    role = Role.new(role_params)

    if role.save
      render json: {
        status: true,
        data: {
          role: role.as_json(methods: [:is_owner])
        }
      }, status: :created
    else
      render json: { status: false, error: role.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/roles/:id
  def update
    role = Role.find(params[:id])

    if role.update(role_params)
      render json: {
        status: true,
        data: {
          role: role.as_json(methods: [:is_owner])
        }
      }
    else
      render json: { status: false, error: role.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { status: false, error: 'Роль не найдена' }, status: :not_found
  end

  # DELETE /api/v1/roles/:id
  def destroy
    role = Role.find(params[:id])

    if role.users.any?
      render json: { status: false, error: 'Невозможно удалить роль, к которой привязаны пользователи' }, status: :unprocessable_entity
    elsif role.destroy
      render json: { status: true, message: 'Роль успешно удалена' }
    else
      render json: { status: false, error: role.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { status: false, error: 'Роль не найдена' }, status: :not_found
  end

  private

  def role_params
    params.require(:role).permit(:name, permissions: [])
  end

  def check_manage_roles_permission
    unless current_user.has_permission?('manage_roles')
      render json: { status: false, error: 'Недостаточно прав для управления ролями' }, status: :forbidden
    end
  end

  def prevent_owner_modification
    role = Role.find_by(id: params[:id])
    if role&.is_owner
      render json: { status: false, error: 'Невозможно изменить или удалить роль Владельца' }, status: :forbidden
    end
  end
end
