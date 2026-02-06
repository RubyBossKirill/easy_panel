class ClientSerializer < BaseSerializer
  class << self
    def attributes
      %i[id name email phone telegram notes creator_id created_at updated_at]
    end

    def associations
      {
        creator: UserSerializer
      }
    end
  end

  def as_json
    result = super

    # Добавляем статистику если запрошена
    if options[:include_stats]
      result[:stats] = {
        appointments_count: object.appointments.count,
        completed_appointments_count: object.appointments.completed.count,
        payments_count: object.payments.count,
        total_paid: object.payments.paid.sum(:amount).to_f
      }
    end

    # Добавляем историю встреч если запрошена
    if options[:include_appointments]
      result[:appointments] = AppointmentSerializer.serialize_collection(
        object.appointments.includes(:employee, :service).order(date: :desc, time: :desc)
      )
    end

    # Добавляем платежи если запрошены
    if options[:include_payments]
      result[:payments] = PaymentSerializer.serialize_collection(
        object.payments.includes(:service, :appointment).order(created_at: :desc)
      )
    end

    result
  end
end
