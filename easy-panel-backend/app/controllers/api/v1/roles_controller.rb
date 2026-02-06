module Api
  module V1
    class RolesController < BaseController
      before_action :authenticate_user!
      before_action :check_manage_roles_permission, only: [:create, :update, :destroy]
      before_action :prevent_owner_modification, only: [:update, :destroy]

      # GET /api/v1/roles
      def index
        roles = Role.all.order(:id)

        render_success(
          { roles: RoleSerializer.serialize_collection(roles) }
        )
      end

      # GET /api/v1/roles/:id
      def show
        role = Role.find(params[:id])

        render_success(
          { role: RoleSerializer.serialize(role) }
        )
      rescue ActiveRecord::RecordNotFound
        render_not_found(t_error('roles.not_found'))
      end

      # POST /api/v1/roles
      def create
        role = Role.new(role_params)

        if role.save
          render_success(
            { role: RoleSerializer.serialize(role) },
            status: :created
          )
        else
          render_validation_errors(role.errors)
        end
      end

      # PATCH/PUT /api/v1/roles/:id
      def update
        role = Role.find(params[:id])

        if role.update(role_params)
          render_success(
            { role: RoleSerializer.serialize(role) }
          )
        else
          render_validation_errors(role.errors)
        end
      rescue ActiveRecord::RecordNotFound
        render_not_found(t_error('roles.not_found'))
      end

      # DELETE /api/v1/roles/:id
      def destroy
        role = Role.find(params[:id])

        if role.users.any?
          return render_error(
            t_error('roles.has_users'),
            code: :has_users
          )
        end

        if role.destroy
          render_success(message: t_message('role_deleted'))
        else
          render_validation_errors(role.errors)
        end
      rescue ActiveRecord::RecordNotFound
        render_not_found(t_error('roles.not_found'))
      end

      private

      def role_params
        params.require(:role).permit(:name, permissions: [])
      end

      def check_manage_roles_permission
        return if current_user.has_permission?('manage_roles')

        render_forbidden(t_error('roles.insufficient_permissions_manage'))
      end

      def prevent_owner_modification
        role = Role.find_by(id: params[:id])
        return unless role&.is_owner

        render_forbidden(t_error('roles.cannot_modify_owner'))
      end
    end
  end
end
