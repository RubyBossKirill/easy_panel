module Api
  module V1
    class ClientsController < BaseController
      before_action :authenticate_user!
      before_action :set_client, only: %i[show update destroy]
      before_action :check_view_clients_permission, only: %i[index show]
      before_action :check_manage_clients_permission, only: %i[create update]
      before_action :check_delete_clients_permission, only: [:destroy]

      # GET /api/v1/clients
      def index
        # Сотрудники видят только своих клиентов
        @clients = if current_user.has_permission?('view_all_clients')
                     Client.all
                   else
                     Client.where(created_by: current_user.id)
                   end

        @clients = @clients.includes(:appointments, :payments)

        # Поиск по имени, email, телефону
        if params[:search].present?
          search_term = "%#{params[:search]}%"
          @clients = @clients.where(
            'name ILIKE ? OR email ILIKE ? OR phone ILIKE ?',
            search_term, search_term, search_term
          )
        end

        # Сортировка
        sort_by = params[:sort_by] || 'created_at'
        sort_order = params[:sort_order] == 'asc' ? 'asc' : 'desc'

        allowed_sort_fields = %w[name email created_at updated_at]
        sort_by = 'created_at' unless allowed_sort_fields.include?(sort_by)

        @clients = @clients.order("#{sort_by} #{sort_order}")

        # Пагинация с Kaminari
        page = params[:page]&.to_i || 1
        per_page = params[:per_page]&.to_i || 25
        per_page = [[per_page, 100].min, 1].max # От 1 до 100 на страницу

        @clients = @clients.page(page).per(per_page)

        render_success(
          {
            clients: ClientSerializer.serialize_collection(@clients),
            pagination: pagination_meta(@clients)
          }
        )
      end

      # GET /api/v1/clients/:id
      def show
        # Проверка доступа
        return render_forbidden(t_error('clients.insufficient_permissions_view')) unless can_view_client?(@client)

        render_success(
          { client: ClientSerializer.serialize(@client, include_stats: true, include_history: true) }
        )
      end

      # POST /api/v1/clients
      def create
        @client = Client.new(client_params)
        @client.created_by = current_user.id

        if @client.save
          render_success(
            { client: ClientSerializer.serialize(@client) },
            status: :created,
            message: t_message('client_created')
          )
        else
          render_validation_errors(@client.errors)
        end
      end

      # PUT /api/v1/clients/:id
      def update
        # Проверка доступа
        return render_forbidden(t_error('clients.insufficient_permissions_edit')) unless can_edit_client?(@client)

        if @client.update(client_params)
          render_success(
            { client: ClientSerializer.serialize(@client) },
            message: t_message('client_updated')
          )
        else
          render_validation_errors(@client.errors)
        end
      end

      # DELETE /api/v1/clients/:id
      def destroy
        # Проверка доступа
        return render_forbidden(t_error('clients.insufficient_permissions_delete')) unless can_delete_client?(@client)

        # Проверка связанных записей
        if @client.appointments.exists?
          appointments_count = @client.appointments.count
          return render_error(
            t_error('clients.has_appointments') + " (#{appointments_count})",
            code: :has_appointments
          )
        end

        # Удаляем связанные платежи
        @client.payments.destroy_all

        @client.destroy
        render_success(message: t_message('client_deleted'))
      end

      private

      def set_client
        @client = Client.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render_not_found(t_error('clients.not_found'))
      end

      def client_params
        params.require(:client).permit(:name, :email, :phone, :telegram, :notes)
      end

      def check_view_clients_permission
        return if current_user.has_permission?('view_clients')

        render_forbidden(t_error('clients.insufficient_permissions_view'))
      end

      def check_manage_clients_permission
        return if current_user.has_permission?('manage_clients')

        render_forbidden(t_error('clients.insufficient_permissions_manage'))
      end

      def check_delete_clients_permission
        return if current_user.has_permission?('delete_clients')

        render_forbidden(t_error('clients.insufficient_permissions_delete'))
      end

      def can_view_client?(client)
        # Владелец и админ видят всех
        return true if current_user.has_permission?('view_all_clients')

        # Сотрудник видит только своих клиентов
        client.created_by == current_user.id
      end

      def can_edit_client?(client)
        # Владелец и админ редактируют всех
        return true if current_user.has_permission?('manage_all_clients')

        # Сотрудник редактирует только своих клиентов
        client.created_by == current_user.id
      end

      def can_delete_client?(client)
        # Владелец и админ удаляют всех
        return true if current_user.has_permission?('manage_all_clients')

        # Сотрудник удаляет только своих клиентов (если есть право)
        current_user.has_permission?('delete_clients') && client.created_by == current_user.id
      end
    end
  end
end
