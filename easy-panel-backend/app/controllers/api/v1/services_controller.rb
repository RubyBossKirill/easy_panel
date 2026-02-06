module Api
  module V1
    class ServicesController < BaseController
      before_action :authenticate_user!
      before_action :set_service, only: [:show, :update, :destroy]
      before_action :check_permissions, only: [:create, :update, :destroy]

      # GET /api/v1/services
      def index
        @services = Service.includes(:employee)

        # Employee может видеть только свои услуги
        @services = @services.where(employee_id: current_user.id) unless current_user.can_view_all?

        # Фильтры
        @services = @services.where(employee_id: params[:employee_id]) if params[:employee_id].present?
        @services = @services.where(is_active: params[:is_active]) if params[:is_active].present?

        # Сортировка
        @services = @services.order(created_at: :desc)

        render_success(
          ServiceSerializer.serialize_collection(@services, include: %i[employee])
        )
      end

      # GET /api/v1/services/:id
      def show
        render_success(
          ServiceSerializer.serialize(@service, include: %i[employee])
        )
      end

      # POST /api/v1/services
      def create
        @service = Service.new(service_params)

        # Если employee_id не указан, используем current_user
        @service.employee_id ||= current_user.id

        if @service.save
          render_success(
            ServiceSerializer.serialize(@service, include: %i[employee]),
            status: :created
          )
        else
          render_validation_errors(@service.errors)
        end
      end

      # PATCH/PUT /api/v1/services/:id
      def update
        if @service.update(service_params)
          render_success(
            ServiceSerializer.serialize(@service, include: %i[employee])
          )
        else
          render_validation_errors(@service.errors)
        end
      end

      # DELETE /api/v1/services/:id
      def destroy
        @service.destroy
        head :no_content
      end

      private

      def set_service
        @service = Service.includes(:employee).find(params[:id])

        # Employee может управлять только своими услугами
        return if current_user.can_view_all? || @service.employee_id == current_user.id

        render_forbidden
      rescue ActiveRecord::RecordNotFound
        render_not_found(t_error('services.not_found'))
      end

      def service_params
        params.require(:service).permit(
          :name,
          :description,
          :employee_id,
          :price,
          :duration,
          :is_active
        )
      end

      def check_permissions
        return if current_user.has_permission?('manage_schedule')

        render_forbidden(t_error('permissions.manage_schedule'))
      end
    end
  end
end
