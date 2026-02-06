module TimeSlots
  class BulkCreateTimeSlotsInteractor < BaseInteractor
    # Массовое создание временных слотов
    # @param current_user [User] текущий пользователь
    # @param params [Hash] параметры создания слотов
    # @return [Result] результат с массивом созданных слотов
    def call(current_user, params)
      authorize!(current_user, 'manage_schedule')

      # Устанавливаем employee_id (по умолчанию текущий пользователь)
      params[:employee_id] ||= current_user.id

      # Проверяем права на создание слотов для другого сотрудника
      if params[:employee_id] != current_user.id && !current_user.can_manage_all?
        failure!(I18n.t('errors.forbidden'), :forbidden)
      end

      # Создаём слоты через builder service
      builder = TimeSlotBuilderService.new(params)

      unless builder.valid?
        failure!(builder.errors.join(', '), :validation_error)
      end

      time_slots = builder.build

      if time_slots.empty?
        failure!(I18n.t('errors.validation_error'), :unprocessable_entity)
      end

      message = I18n.t('success.time_slots.created', count: time_slots.count)
      success(time_slots, message)
    end
  end
end
