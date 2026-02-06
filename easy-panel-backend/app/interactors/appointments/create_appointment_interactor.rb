module Appointments
  class CreateAppointmentInteractor < BaseInteractor
    # Создание встречи с обновлением TimeSlot
    # @param current_user [User] текущий пользователь
    # @param params [Hash] параметры создания
    # @return [Result] результат с созданной встречей
    def call(current_user, params)
      authorize!(current_user, 'manage_schedule')

      # Устанавливаем employee_id если не указан
      params[:employee_id] ||= current_user.id

      appointment = nil
      time_slot = nil

      # Используем транзакцию для атомарности
      ActiveRecord::Base.transaction do
        # Если указан time_slot_id, загружаем его и проверяем доступность
        if params[:time_slot_id].present?
          time_slot = find_and_validate_time_slot!(params[:time_slot_id])
        end

        # Создаём встречу
        appointment = Appointment.new(params.except(:time_slot_id))
        save_record!(appointment)

        # Если есть time_slot, связываем его со встречей
        if time_slot
          time_slot.update!(appointment: appointment, available: false)
        end
      end

      success(appointment, I18n.t('success.appointments.created'))
    end

    private

    # Поиск и валидация временного слота
    def find_and_validate_time_slot!(time_slot_id)
      time_slot = find_record!(TimeSlot, time_slot_id)

      # Проверяем доступность слота
      unless time_slot.available
        failure!(I18n.t('errors.appointments.time_slot_not_available'), :unprocessable_entity)
      end

      # Проверяем что слот не занят другой встречей
      if time_slot.appointment.present?
        failure!(I18n.t('errors.appointments.time_slot_not_available'), :unprocessable_entity)
      end

      time_slot
    end
  end
end
