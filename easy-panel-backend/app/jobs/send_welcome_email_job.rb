# Background job для отправки приветственного email новым пользователям
class SendWelcomeEmailJob < ApplicationJob
  queue_as :mailers

  def perform(user_id)
    user = User.find_by(id: user_id)
    return unless user

    Rails.logger.info "Sending welcome email to #{user.email}"

    # TODO: Интегрировать с email сервисом
    # UserMailer.welcome_email(user).deliver_now
  end
end
