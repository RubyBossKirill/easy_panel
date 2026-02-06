module Api
  module V1
    class UsersController < BaseController
      before_action :authenticate_user!
      before_action :set_user, only: %i[show update destroy]
      before_action :check_manage_users_permission, only: %i[create]
      before_action :check_delete_users_permission, only: [:destroy]

      # GET /api/v1/users
      def index
        @users = User.includes(:role).order(created_at: :desc)

        # Фильтрация по роли
        @users = @users.where(role_id: params[:role_id]) if params[:role_id].present?

        # Поиск по имени или email
        if params[:search].present?
          search_term = "%#{params[:search]}%"
          @users = @users.where('name ILIKE ? OR email ILIKE ?', search_term, search_term)
        end

        # Пагинация с Kaminari (25 на страницу по умолчанию)
        page = params[:page]&.to_i || 1
        per_page = params[:per_page]&.to_i || 25
        per_page = [[per_page, 100].min, 1].max # От 1 до 100 на страницу

        @users = @users.page(page).per(per_page)

        render_success(
          {
            users: UserSerializer.serialize_collection(@users),
            pagination: pagination_meta(@users)
          }
        )
      end

      # GET /api/v1/users/:id
      def show
        # Сотрудники могут видеть только свой профиль
        return render_forbidden(t_error('users.insufficient_permissions_view')) unless can_view_user?(@user)

        render_success(
          { user: UserSerializer.serialize(@user, include_stats: true) }
        )
      end

      # POST /api/v1/users
      def create
        result = Users::CreateUserInteractor.call(current_user, user_params.to_h)

        if result.success?
          render_success(
            { user: UserSerializer.serialize(result.data) },
            status: :created,
            message: t_message('user_created')
          )
        else
          render_error(result.message, code: result.code)
        end
      end

      # PUT /api/v1/users/:id
      def update
        # Пользователь может редактировать свой профиль
        # Администраторы и владельцы могут редактировать других
        return render_forbidden(t_error('users.insufficient_permissions_edit')) unless can_edit_user?(@user)

        # Дополнительная проверка текущего пароля если пользователь меняет свой пароль
        if @user.id == current_user.id && user_params[:password].present? && params[:current_password].present?
          unless @user.authenticate(params[:current_password])
            return render_error(t_error('users.invalid_password'), code: :invalid_password)
          end
        end

        result = Users::UpdateUserInteractor.call(current_user, @user, user_params.to_h)

        if result.success?
          render_success(
            { user: UserSerializer.serialize(result.data) },
            message: t_message('user_updated')
          )
        else
          render_error(result.message, code: result.code)
        end
      end

      # DELETE /api/v1/users/:id
      def destroy
        result = Users::DeleteUserInteractor.call(current_user, @user)

        if result.success?
          render_success(message: t_message('user_deleted'))
        else
          render_error(result.message, code: result.code)
        end
      end

      private

      def set_user
        @user = User.includes(:role).find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render_not_found(t_error('users.not_found'))
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
        return if current_user.has_permission?('manage_users')

        render_forbidden(t_error('users.insufficient_permissions_manage'))
      end

      def check_delete_users_permission
        return if current_user.has_permission?('delete_users')

        render_forbidden(t_error('users.insufficient_permissions_delete'))
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
    end
  end
end
