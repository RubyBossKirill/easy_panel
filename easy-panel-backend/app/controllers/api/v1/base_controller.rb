module Api
  module V1
    class BaseController < ApplicationController
      include Translatable

      # Успешный ответ с данными
      # @param data [Object, nil] данные для ответа
      # @param status [Symbol] HTTP статус (по умолчанию :ok)
      # @param message [String, nil] опциональное сообщение
      def render_success(data = nil, status: :ok, message: nil)
        response = { status: true }
        response[:data] = data if data.present?
        response[:message] = message if message.present?

        render json: response, status: status
      end

      # Ответ с ошибкой
      # @param message [String] сообщение об ошибке
      # @param code [Symbol, String, nil] код ошибки
      # @param status [Symbol] HTTP статус (по умолчанию :unprocessable_entity)
      def render_error(message, code: nil, status: :unprocessable_entity)
        response = { status: false, error: message }
        response[:code] = code if code.present?

        render json: response, status: status
      end

      # Ответ с ошибками валидации
      # @param errors [ActiveModel::Errors, Array<String>] ошибки валидации
      def render_validation_errors(errors)
        error_messages = if errors.respond_to?(:full_messages)
                           errors.full_messages
                         else
                           Array(errors)
                         end

        render_error(error_messages.join(', '), code: :validation_error, status: :unprocessable_entity)
      end

      # Ответ "не найдено"
      # @param message [String, nil] сообщение (по умолчанию берётся из переводов)
      def render_not_found(message = nil)
        message ||= t_error('not_found')
        render_error(message, code: :not_found, status: :not_found)
      end

      # Ответ "доступ запрещён"
      # @param message [String, nil] сообщение (по умолчанию берётся из переводов)
      def render_forbidden(message = nil)
        message ||= t_error('forbidden')
        render_error(message, code: :forbidden, status: :forbidden)
      end

      # Вспомогательный метод для пагинации (с поддержкой Kaminari)
      # @param collection [ActiveRecord::Relation] пагинированная коллекция
      # @return [Hash] метаданные пагинации
      def pagination_meta(collection)
        {
          current_page: collection.current_page,
          per_page: collection.limit_value,
          total_count: collection.total_count,
          total_pages: collection.total_pages
        }
      end
    end
  end
end
