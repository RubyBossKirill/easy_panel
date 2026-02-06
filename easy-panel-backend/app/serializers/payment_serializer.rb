class PaymentSerializer < BaseSerializer
  class << self
    def attributes
      %i[
        id client_id appointment_id service_id amount
        discount_type discount_value discount_amount
        status payment_method payment_link prodamus_order_id
        paid_at created_at updated_at
      ]
    end

    def associations
      {
        client: ClientSerializer,
        service: ServiceSerializer,
        appointment: AppointmentSerializer
      }
    end
  end

  def as_json
    result = super

    # Добавляем итоговую сумму с учётом скидки
    result[:final_amount] = object.final_amount

    result
  end
end
