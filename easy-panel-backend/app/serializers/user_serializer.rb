class UserSerializer < BaseSerializer
  class << self
    def attributes
      %i[id email name phone telegram role_id created_at updated_at]
    end

    def associations
      {
        role: RoleSerializer
      }
    end
  end

  def as_json
    result = super

    # Добавляем статистику если запрошена
    if options[:include_stats]
      result[:stats] = {
        clients_count: object.clients.count,
        appointments_count: object.appointments.count,
        services_count: object.services.count
      }
    end

    result
  end
end
