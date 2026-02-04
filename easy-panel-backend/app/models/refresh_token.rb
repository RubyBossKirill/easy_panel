class RefreshToken < ApplicationRecord
  belongs_to :user

  # Шифруем чувствительные данные (IP и device_info)
  encrypts :device_info, :ip_address, deterministic: false

  # Шифруем токен для защиты в БД
  encrypts :token, deterministic: false

  validates :token, presence: true, uniqueness: true
  validates :expires_at, presence: true

  scope :active, -> { where(revoked: false).where('expires_at > ?', Time.current) }
  scope :expired, -> { where('expires_at <= ?', Time.current) }
  scope :revoked, -> { where(revoked: true) }

  before_validation :generate_token, on: :create
  before_validation :set_expiration, on: :create

  def self.generate_for_user(user, device_info: nil, ip_address: nil)
    create!(
      user: user,
      device_info: device_info,
      ip_address: ip_address
    )
  end

  def revoke!
    update!(revoked: true)
  end

  def expired?
    expires_at <= Time.current
  end

  def valid_token?
    !revoked && !expired?
  end

  private

  def generate_token
    # Генерируем случайный токен (будет автоматически зашифрован при сохранении)
    self.token ||= SecureRandom.urlsafe_base64(64)
  end

  def set_expiration
    self.expires_at ||= 30.days.from_now
  end
end
