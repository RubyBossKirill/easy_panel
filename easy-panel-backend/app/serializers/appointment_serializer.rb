class AppointmentSerializer < BaseSerializer
  class << self
    def attributes
      %i[id client_id employee_id date time duration service_id status notes created_at updated_at]
    end

    def associations
      {
        client: ClientSerializer,
        employee: UserSerializer,
        service: ServiceSerializer,
        time_slot: TimeSlotSerializer,
        payment: -> { PaymentSerializer }
      }
    end
  end

  def as_json
    result = super

    # Форматируем время как строку HH:MM
    result[:time] = object.time.strftime('%H:%M') if object.time.present?

    result
  end
end
