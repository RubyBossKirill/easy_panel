class BaseInteractor
  # Результат выполнения интерактора
  class Result
    attr_reader :data, :message, :code

    def initialize(success:, data: nil, message: nil, code: nil)
      @success = success
      @data = data
      @message = message
      @code = code
    end

    # Проверка успешности
    # @return [Boolean] true если успешно
    def success?
      @success
    end

    # Проверка неуспешности
    # @return [Boolean] true если провалено
    def failure?
      !@success
    end
  end

  # Исключение для прерывания выполнения
  class Failure < StandardError
    attr_reader :message, :code

    def initialize(message, code = nil)
      @message = message
      @code = code
      super(message)
    end
  end

  class << self
    # Основной метод вызова интерактора
    # @param args [Array] аргументы для метода call
    # @return [Result] результат выполнения
    def call(*args, **kwargs)
      new.call(*args, **kwargs)
    rescue Failure => e
      failure(e.message, e.code)
    rescue StandardError => e
      Rails.logger.error("#{name} failed: #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))
      failure("Internal error: #{e.message}", :internal_error)
    end

    private

    # Создание успешного результата
    # @param data [Object] данные результата
    # @param message [String, nil] сообщение об успехе
    # @return [Result] успешный результат
    def success(data = nil, message = nil)
      Result.new(success: true, data: data, message: message)
    end

    # Создание неуспешного результата
    # @param message [String] сообщение об ошибке
    # @param code [Symbol, String, nil] код ошибки
    # @return [Result] неуспешный результат
    def failure(message, code = nil)
      Result.new(success: false, message: message, code: code)
    end
  end

  # Метод выполнения интерактора (переопределяется в наследниках)
  # @raise [NotImplementedError] если не переопределён
  def call(*_args, **_kwargs)
    raise NotImplementedError, "#{self.class.name} must implement #call method"
  end

  private

  # Создание успешного результата
  # @param data [Object] данные результата
  # @param message [String, nil] сообщение об успехе
  # @return [Result] успешный результат
  def success(data = nil, message = nil)
    self.class.send(:success, data, message)
  end

  # Создание неуспешного результата
  # @param message [String] сообщение об ошибке
  # @param code [Symbol, String, nil] код ошибки
  # @return [Result] неуспешный результат
  def failure(message, code = nil)
    self.class.send(:failure, message, code)
  end

  # Прерывание выполнения с ошибкой
  # @param message [String] сообщение об ошибке
  # @param code [Symbol, String, nil] код ошибки
  # @raise [Failure] исключение с сообщением
  def failure!(message, code = nil)
    raise Failure.new(message, code)
  end

  # Проверка прав доступа
  # @param user [User] пользователь
  # @param permission [String] название разрешения
  # @raise [Failure] если нет прав
  def authorize!(user, permission)
    return if user.has_permission?(permission)

    failure!(I18n.t('errors.forbidden'), :forbidden)
  end

  # Поиск записи или ошибка
  # @param model [Class] класс модели
  # @param id [Integer, String] ID записи
  # @return [ActiveRecord::Base] найденная запись
  # @raise [Failure] если запись не найдена
  def find_record!(model, id)
    model.find(id)
  rescue ActiveRecord::RecordNotFound
    failure!(I18n.t('errors.not_found'), :not_found)
  end

  # Валидация и сохранение записи
  # @param record [ActiveRecord::Base] запись для сохранения
  # @raise [Failure] если валидация не прошла
  def save_record!(record)
    return if record.save

    failure!(record.errors.full_messages.join(', '), :validation_error)
  end
end
