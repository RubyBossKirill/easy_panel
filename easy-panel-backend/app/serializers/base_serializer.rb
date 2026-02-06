class BaseSerializer
  class << self
    # Сериализация одного объекта
    # @param object [ActiveRecord::Base] объект для сериализации
    # @param options [Hash] опции сериализации
    # @option options [Array<Symbol>] :include включаемые ассоциации
    # @option options [Array<Symbol>] :exclude исключаемые атрибуты
    # @option options [Array<Symbol>] :methods дополнительные методы
    # @return [Hash] сериализованные данные
    def serialize(object, **options)
      return nil if object.nil?

      new(object, options).as_json
    end

    # Сериализация коллекции объектов
    # @param collection [ActiveRecord::Relation, Array] коллекция объектов
    # @param options [Hash] опции сериализации
    # @return [Array<Hash>] массив сериализованных данных
    def serialize_collection(collection, **options)
      return [] if collection.nil? || collection.empty?

      collection.map { |object| serialize(object, **options) }
    end

    # Атрибуты для сериализации (переопределяется в наследниках)
    # @return [Array<Symbol>] список атрибутов
    def attributes
      []
    end

    # Ассоциации для включения (переопределяется в наследниках)
    # @return [Hash] хеш ассоциаций { association_name: SerializerClass }
    def associations
      {}
    end
  end

  attr_reader :object, :options

  def initialize(object, options = {})
    @object = object
    @options = options
  end

  # Преобразование в JSON
  # @return [Hash] сериализованные данные
  def as_json
    result = base_attributes

    # Добавляем дополнительные методы
    if options[:methods].present?
      Array(options[:methods]).each do |method|
        result[method] = object.public_send(method) if object.respond_to?(method)
      end
    end

    # Добавляем ассоциации
    if options[:include].present?
      Array(options[:include]).each do |association|
        result[association] = serialize_association(association)
      end
    end

    result
  end

  private

  # Базовые атрибуты объекта
  # @return [Hash] атрибуты
  def base_attributes
    attrs = self.class.attributes.dup

    # Исключаем атрибуты
    if options[:exclude].present?
      attrs -= Array(options[:exclude])
    end

    # Формируем хеш атрибутов
    attrs.each_with_object({}) do |attr, hash|
      hash[attr] = object.public_send(attr) if object.respond_to?(attr)
    end
  end

  # Сериализация ассоциации
  # @param association [Symbol] название ассоциации
  # @return [Hash, Array<Hash>, nil] сериализованная ассоциация
  def serialize_association(association)
    return nil unless object.respond_to?(association)

    associated_object = object.public_send(association)
    return nil if associated_object.nil?

    serializer_class = self.class.associations[association]

    if serializer_class
      # Используем специфичный сериализатор
      if associated_object.respond_to?(:each)
        serializer_class.serialize_collection(associated_object, **association_options)
      else
        serializer_class.serialize(associated_object, **association_options)
      end
    else
      # Стандартная сериализация
      if associated_object.respond_to?(:as_json)
        associated_object.as_json
      else
        associated_object
      end
    end
  end

  # Опции для вложенных ассоциаций
  # @return [Hash] опции
  def association_options
    options.except(:include, :exclude, :methods)
  end
end
