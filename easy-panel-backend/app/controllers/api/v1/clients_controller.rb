class Api::V1::ClientsController < ApplicationController
  before_action :set_client, only: %i[show update destroy]
  before_action :check_view_clients_permission, only: %i[index show]
  before_action :check_manage_clients_permission, only: %i[create update]
  before_action :check_delete_clients_permission, only: [:destroy]

  # GET /api/v1/clients
  def index
    # Сотрудники видят только своих клиентов
    if current_user.has_permission?('view_all_clients')
      @clients = Client.all
    else
      @clients = Client.where(created_by: current_user.id)
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

    # Пагинация
    page = params[:page]&.to_i || 1
    per_page = params[:per_page]&.to_i || 25
    per_page = [per_page, 100].min # Максимум 100 на страницу
    offset = (page - 1) * per_page

    total_count = @clients.count
    @clients = @clients.limit(per_page).offset(offset)

    render json: {
      status: true,
      data: {
        clients: @clients.map { |client| client_response(client, include_stats: false) },
        pagination: {
          current_page: page,
          per_page: per_page,
          total_count: total_count,
          total_pages: (total_count.to_f / per_page).ceil
        }
      }
    }
  end

  # GET /api/v1/clients/:id
  def show
    # Проверка доступа
    unless can_view_client?(@client)
      return render json: {
        status: false,
        error: 'Недостаточно прав для просмотра этого клиента',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      }, status: :forbidden
    end

    render json: {
      status: true,
      data: { client: client_response(@client, include_stats: true, include_history: true) }
    }
  end

  # POST /api/v1/clients
  def create
    @client = Client.new(client_params)
    @client.created_by = current_user.id

    if @client.save
      render json: {
        status: true,
        data: { client: client_response(@client) },
        message: 'Клиент успешно создан'
      }, status: :created
    else
      render json: {
        status: false,
        error: @client.errors.full_messages.join(', '),
        code: 'VALIDATION_ERROR'
      }, status: :unprocessable_entity
    end
  end

  # PUT /api/v1/clients/:id
  def update
    # Проверка доступа
    unless can_edit_client?(@client)
      return render json: {
        status: false,
        error: 'Недостаточно прав для редактирования этого клиента',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      }, status: :forbidden
    end

    if @client.update(client_params)
      render json: {
        status: true,
        data: { client: client_response(@client) },
        message: 'Клиент успешно обновлён'
      }
    else
      render json: {
        status: false,
        error: @client.errors.full_messages.join(', '),
        code: 'VALIDATION_ERROR'
      }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/clients/:id
  def destroy
    # Проверка доступа
    unless can_delete_client?(@client)
      return render json: {
        status: false,
        error: 'Недостаточно прав для удаления этого клиента',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      }, status: :forbidden
    end

    # Проверка связанных записей
    if @client.appointments.exists?
      appointments_count = @client.appointments.count
      return render json: {
        status: false,
        error: "Невозможно удалить клиента с существующими записями (#{appointments_count})",
        code: 'HAS_APPOINTMENTS',
        data: { appointments_count: appointments_count }
      }, status: :unprocessable_entity
    end

    # Удаляем связанные платежи
    @client.payments.destroy_all

    @client.destroy
    render json: {
      status: true,
      message: 'Клиент успешно удалён'
    }
  end

  private

  def set_client
    @client = Client.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: {
      status: false,
      error: 'Клиент не найден',
      code: 'CLIENT_NOT_FOUND'
    }, status: :not_found
  end

  def client_params
    params.require(:client).permit(:name, :email, :phone, :telegram, :notes)
  end

  def check_view_clients_permission
    unless current_user.has_permission?('view_clients')
      render json: {
        status: false,
        error: 'Недостаточно прав для просмотра клиентов',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      }, status: :forbidden
    end
  end

  def check_manage_clients_permission
    unless current_user.has_permission?('manage_clients')
      render json: {
        status: false,
        error: 'Недостаточно прав для управления клиентами',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      }, status: :forbidden
    end
  end

  def check_delete_clients_permission
    unless current_user.has_permission?('delete_clients')
      render json: {
        status: false,
        error: 'Недостаточно прав для удаления клиентов',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      }, status: :forbidden
    end
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

  def client_response(client, include_stats: false, include_history: false)
    response = {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      telegram: client.telegram,
      notes: client.notes,
      created_by: client.created_by,
      created_at: client.created_at,
      updated_at: client.updated_at
    }

    if include_stats
      last_appointment = client.appointments.order(date: :desc, time: :desc).first
      total_spent = client.payments.sum(:amount)

      response[:stats] = {
        total_visits: client.appointments.where(status: 'completed').count,
        pending_appointments: client.appointments.where(status: 'pending').count,
        confirmed_appointments: client.appointments.where(status: 'confirmed').count,
        last_visit: last_appointment&.date,
        total_spent: total_spent.to_f
      }
    end

    if include_history
      response[:appointments] = client.appointments
        .order(date: :desc, time: :desc)
        .limit(10)
        .map do |apt|
          {
            id: apt.id,
            date: apt.date,
            time: apt.time,
            service: apt.service,
            status: apt.status,
            employee_id: apt.employee_id
          }
        end

      response[:payments] = client.payments
        .order(paid_at: :desc)
        .limit(10)
        .map do |payment|
          {
            id: payment.id,
            amount: payment.amount.to_f,
            service: payment.service,
            paid_at: payment.paid_at,
            employee_id: payment.employee_id
          }
        end
    end

    response
  end
end
