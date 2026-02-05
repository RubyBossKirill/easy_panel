module Api
  module V1
    class ServicesController < ApplicationController
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

        render json: @services.as_json(
          include: {
            employee: { only: [:id, :name, :email] }
          }
        )
      end

      # GET /api/v1/services/:id
      def show
        render json: @service.as_json(
          include: {
            employee: { only: [:id, :name, :email] }
          }
        )
      end

      # POST /api/v1/services
      def create
        @service = Service.new(service_params)

        # Если employee_id не указан, используем current_user
        @service.employee_id ||= current_user.id

        if @service.save
          render json: @service.as_json(
            include: {
              employee: { only: [:id, :name, :email] }
            }
          ), status: :created
        else
          render json: { errors: @service.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH/PUT /api/v1/services/:id
      def update
        if @service.update(service_params)
          render json: @service.as_json(
            include: {
              employee: { only: [:id, :name, :email] }
            }
          )
        else
          render json: { errors: @service.errors.full_messages }, status: :unprocessable_entity
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
        unless current_user.can_view_all? || @service.employee_id == current_user.id
          render json: { error: 'Forbidden' }, status: :forbidden
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Service not found' }, status: :not_found
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
        unless current_user.has_permission?('manage_schedule')
          render json: { error: 'You do not have permission to perform this action' }, status: :forbidden
        end
      end
    end
  end
end
