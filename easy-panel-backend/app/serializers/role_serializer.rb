class RoleSerializer < BaseSerializer
  class << self
    def attributes
      %i[id name description permissions is_owner created_at updated_at]
    end

    def associations
      {}
    end
  end

  def as_json
    result = super

    # Всегда добавляем переведённые разрешения
    result[:translated_permissions] = object.translated_permissions

    result
  end
end
