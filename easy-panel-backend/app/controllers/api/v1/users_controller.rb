class Api::V1::UsersController < ApplicationController
  before_action :set_user, only: %i[show update destroy]
  before_action :check_manage_users_permission, only: %i[index create]
  before_action :check_delete_users_permission, only: [:destroy]

  # GET /api/v1/users
  def index
    @users = User.includes(:role).order(created_at: :desc)

    # Фильтрация по роли
    if params[:role_id].present?
      @users = @users.where(role_id: params[:role_id])
    end

    # Поиск по имени или email
    if params[:search].present?
      search_term = "%#{params[:search]}%"
      @users = @users.where('name ILIKE ? OR email ILIKE ?', search_term, search_term)
    end

    # Пагинация (25 на страницу по умолчанию)
    page = params[:page]&.to_i || 1
    per_page = params[:per_page]&.to_i || 25
    offset = (page - 1) * per_page

    total_count = @users.count
    @users = @users.limit(per_page).offset(offset)

    render json: {
      status: true,
      data: {
        users: @users.map { |user| user_response(user) },
        pagination: {
          current_page: page,
          per_page: per_page,
          total_count: total_count,
          total_pages: (total_count.to_f / per_page).ceil
        }
      }
    }
  end

  # GET /api/v1/users/:id
  def show
    # Сотрудники могут видеть только свой профиль
    unless can_view_user?(@user)
      return render json: {
        status: false,
        error: 'Недостаточно прав для просмотра этого пользователя',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      }, status: :forbidden
    end

    render json: {
      status: true,
      data: { user: user_response(@user, include_stats: true) }
    }
  end

  # POST /api/v1/users
  def create
    @user = User.new(user_params)
    @user.email = @user.email&.downcase

    # Проверка: только Owner может создавать других Owners
    if @user.role&.is_owner && !current_user.role.is_owner
      return render json: {
        status: false,
        error: 'Только владелец может создавать других владельцев',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      }, status: :forbidden
    end

    if @user.save
      render json: {
        status: true,
        data: { user: user_response(@user) },
        message: 'Пользователь успешно создан'
      }, status: :created
    else
      render json: {
        status: false,
        error: @user.errors.full_messages.join(', '),
        code: 'VALIDATION_ERROR'
      }, status: :unprocessable_entity
    end
  end

  # PUT /api/v1/users/:id
  def update
    # Пользователь может редактировать свой профиль
    # Администраторы и владельцы могут редактировать других
    unless can_edit_user?(@user)
      return render json: {
        status: false,
        error: 'Недостаточно прав для редактирования этого пользователя',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      }, status: :forbidden
    end

    # Проверка: нельзя изменить роль Owner у себя (последний Owner)
    if @user.role&.is_owner &&
       params[:user][:role_id].present? &&
       @user.id == current_user.id &&
       Role.find(params[:user][:role_id]).is_owner == false &&
       User.joins(:role).where(roles: { is_owner: true }).count == 1
      return render json: {
        status: false,
        error: 'Нельзя изменить роль последнего владельца',
        code: 'LAST_OWNER_ERROR'
      }, status: :unprocessable_entity
    end

    # Проверка: только Owner может менять роль на Owner
    if params[:user][:role_id].present?
      new_role = Role.find_by(id: params[:user][:role_id])
      if new_role&.is_owner && !current_user.role.is_owner
        return render json: {
          status: false,
          error: 'Только владелец может назначать роль владельца',
          code: 'AUTH_INSUFFICIENT_PERMISSIONS'
        }, status: :forbidden
      end
    end

    # Обновление пароля отдельно
    update_params = user_params
    if update_params[:password].present?
      # Проверка старого пароля при смене (если пользователь меняет свой)
      if @user.id == current_user.id && params[:current_password].present?
        unless @user.authenticate(params[:current_password])
          return render json: {
            status: false,
            error: 'Неверный текущий пароль',
            code: 'INVALID_PASSWORD'
          }, status: :unprocessable_entity
        end
      end
    else
      update_params.delete(:password)
      update_params.delete(:password_confirmation)
    end

    if @user.update(update_params)
      render json: {
        status: true,
        data: { user: user_response(@user) },
        message: 'Пользователь успешно обновлён'
      }
    else
      render json: {
        status: false,
        error: @user.errors.full_messages.join(', '),
        code: 'VALIDATION_ERROR'
      }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/users/:id
  def destroy
    # Нельзя удалить самого себя
    if @user.id == current_user.id
      return render json: {
        status: false,
        error: 'Нельзя удалить самого себя',
        code: 'CANNOT_DELETE_SELF'
      }, status: :unprocessable_entity
    end

    # Нельзя удалить последнего Owner
    if @user.role&.is_owner && User.joins(:role).where(roles: { is_owner: true }).count == 1
      return render json: {
        status: false,
        error: 'Нельзя удалить последнего владельца',
        code: 'LAST_OWNER_ERROR'
      }, status: :unprocessable_entity
    end

    # Проверка связанных данных
    if @user.clients.exists? || @user.appointments.exists?
      return render json: {
        status: false,
        error: 'Невозможно удалить пользователя с существующими клиентами или записями',
        code: 'HAS_DEPENDENCIES',
        data: {
          clients_count: @user.clients.count,
          appointments_count: @user.appointments.count
        }
      }, status: :unprocessable_entity
    end

    @user.destroy
    render json: {
      status: true,
      message: 'Пользователь успешно удалён'
    }
  end

  private

  def set_user
    @user = User.includes(:role).find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: {
      status: false,
      error: 'Пользователь не найден',
      code: 'USER_NOT_FOUND'
    }, status: :not_found
  end

  def user_params
    params.require(:user).permit(
      :name,
      :email,
      :password,
      :password_confirmation,
      :role_id,
      :phone,
      :telegram
    )
  end

  def check_manage_users_permission
    unless current_user.has_permission?('manage_users')
      render json: {
        status: false,
        error: 'Недостаточно прав для управления пользователями',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      }, status: :forbidden
    end
  end

  def check_delete_users_permission
    unless current_user.has_permission?('delete_users')
      render json: {
        status: false,
        error: 'Недостаточно прав для удаления пользователей',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      }, status: :forbidden
    end
  end

  def can_view_user?(user)
    # Владелец и админ видят всех
    return true if current_user.has_permission?('manage_users')
    # Сотрудник видит только себя
    current_user.id == user.id
  end

  def can_edit_user?(user)
    # Владелец и админ редактируют всех
    return true if current_user.has_permission?('manage_users')
    # Пользователь может редактировать только себя
    current_user.id == user.id
  end

  def user_response(user, include_stats: false)
    response = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      telegram: user.telegram,
      role_id: user.role_id,
      role: {
        id: user.role.id,
        name: user.role.name,
        is_owner: user.role.is_owner,
        permissions: user.role.permissions
      },
      created_at: user.created_at,
      updated_at: user.updated_at
    }

    if include_stats
      response[:stats] = {
        clients_count: user.clients.count,
        appointments_count: user.appointments.count,
        completed_appointments_count: user.appointments.where(status: 'completed').count
      }
    end

    response
  end
end
