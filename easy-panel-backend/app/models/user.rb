class User < ApplicationRecord
  has_secure_password

  belongs_to :role
  has_many :appointments, foreign_key: :employee_id, dependent: :destroy
  has_many :time_slots, foreign_key: :employee_id, dependent: :destroy
  has_many :clients, foreign_key: :created_by, dependent: :nullify
  has_many :refresh_tokens, dependent: :destroy

  validates :email, presence: true, uniqueness: { case_sensitive: false },
            format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true
  validates :password, length: { minimum: 8 }, allow_nil: true

  before_save :downcase_email

  def has_permission?(permission)
    role&.permissions&.include?(permission.to_s)
  end

  private

  def downcase_email
    self.email = email.downcase
  end
end
