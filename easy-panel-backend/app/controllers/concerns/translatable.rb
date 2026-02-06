module Translatable
  extend ActiveSupport::Concern

  # Получить перевод ошибки
  # @param key [String, Symbol] ключ перевода (например 'users.not_found')
  # @param options [Hash] опции для интерполяции
  # @return [String] переведённое сообщение
  def t_error(key, **options)
    I18n.t("errors.#{key}", **options)
  end

  # Получить перевод сообщения
  # @param key [String, Symbol] ключ перевода (например 'user_created')
  # @param options [Hash] опции для интерполяции
  # @return [String] переведённое сообщение
  def t_message(key, **options)
    I18n.t("messages.#{key}", **options)
  end
end
