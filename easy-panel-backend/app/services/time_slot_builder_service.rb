class TimeSlotBuilderService
  attr_reader :errors

  def initialize(params)
    @employee_id = params[:employee_id]
    @date = params[:date]
    @start_time = params[:start_time]
    @end_time = params[:end_time]
    @duration = params[:duration]&.to_i || 60
    @break_duration = params[:break_duration]&.to_i || 0
    @errors = []
  end

  # Валидация параметров
  # @return [Boolean] true если параметры валидны
  def valid?
    @errors = []

    if @date.blank? || @start_time.blank? || @end_time.blank?
      @errors << 'Missing required parameters: date, start_time, end_time'
      return false
    end

    if @duration <= 0
      @errors << 'Duration must be greater than 0'
      return false
    end

    begin
      start_time_obj = Time.parse(@start_time)
      end_time_obj = Time.parse(@end_time)

      if end_time_obj <= start_time_obj
        @errors << 'End time must be after start time'
        return false
      end
    rescue ArgumentError
      @errors << 'Invalid time format'
      return false
    end

    true
  end

  # Построение слотов
  # @return [Array<TimeSlot>] массив созданных слотов
  def build
    return [] unless valid?

    slots = []
    current_time = Time.parse(@start_time)
    end_time_obj = Time.parse(@end_time)

    while current_time < end_time_obj
      # Проверяем что следующий слот не выходит за границы
      slot_end_time = current_time + @duration.minutes
      break if slot_end_time > end_time_obj

      time_slot = TimeSlot.new(
        employee_id: @employee_id,
        date: @date,
        time: current_time.strftime('%H:%M'),
        duration: @duration,
        available: true
      )

      if time_slot.save
        slots << time_slot
      else
        @errors << "Failed to create slot at #{current_time.strftime('%H:%M')}: #{time_slot.errors.full_messages.join(', ')}"
        Rails.logger.warn @errors.last
      end

      # Переходим к следующему слоту с учётом перерыва
      current_time += (@duration + @break_duration).minutes
    end

    slots
  end
end
