# Пример background job для отправки напоминаний о встречах
class SendAppointmentReminderJob < ApplicationJob
  queue_as :notifications

  # Retry up to 3 times with exponential backoff
  retry_on StandardError, wait: :exponentially_longer, attempts: 3

  def perform(appointment_id)
    appointment = Appointment.find_by(id: appointment_id)
    return unless appointment

    # TODO: Интегрировать с SMS/Email сервисом
    Rails.logger.info "Sending reminder for appointment ##{appointment.id}"
    Rails.logger.info "Client: #{appointment.client&.name}"
    Rails.logger.info "Date: #{appointment.date} at #{appointment.time}"

    # Здесь будет отправка SMS/Email
    # SmsService.send_reminder(appointment)
    # AppointmentMailer.reminder(appointment).deliver_now
  end
end
