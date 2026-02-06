class ServiceSerializer < BaseSerializer
  class << self
    def attributes
      %i[id name description price duration employee_id is_active created_at updated_at]
    end

    def associations
      {
        employee: UserSerializer
      }
    end
  end
end
