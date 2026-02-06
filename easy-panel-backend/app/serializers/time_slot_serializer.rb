class TimeSlotSerializer < BaseSerializer
  class << self
    def attributes
      %i[id employee_id date time duration available created_at updated_at]
    end

    def associations
      {
        employee: UserSerializer,
        appointment: AppointmentSerializer
      }
    end
  end

  def as_json
    result = super

    # Форматируем время как строку HH:MM
    result[:time] = object.time.strftime('%H:%M') if object.time.present?

    # Добавляем информацию о доступности
    result[:is_booked] = object.appointment.present?

    result
  end
end
