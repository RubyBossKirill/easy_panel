class Payment < ApplicationRecord
  belongs_to :client
  belongs_to :appointment
  belongs_to :service, optional: true

  # Статусы платежа
  STATUSES = %w[pending paid cancelled failed].freeze

  # Методы оплаты
  PAYMENT_METHODS = %w[online cash card transfer].freeze

  # Типы скидок
  DISCOUNT_TYPES = %w[percent amount].freeze

  validates :status, inclusion: { in: STATUSES }
  validates :payment_method, inclusion: { in: PAYMENT_METHODS }
  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :prodamus_order_id, uniqueness: true, allow_nil: true
  validates :discount_type, inclusion: { in: DISCOUNT_TYPES }, allow_nil: true
  validates :discount_value, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  # Callback для расчета суммы скидки перед сохранением
  before_save :calculate_discount_amount

  # Скоупы для фильтрации
  scope :pending, -> { where(status: 'pending') }
  scope :paid, -> { where(status: 'paid') }
  scope :cancelled, -> { where(status: 'cancelled') }
  scope :failed, -> { where(status: 'failed') }
  scope :online, -> { where(payment_method: 'online') }
  scope :offline, -> { where(payment_method: %w[cash card transfer]) }

  # Методы для проверки статуса
  def pending?
    status == 'pending'
  end

  def paid?
    status == 'paid'
  end

  def cancelled?
    status == 'cancelled'
  end

  def failed?
    status == 'failed'
  end

  # Пометить как оплаченный
  def mark_as_paid!
    update!(status: 'paid', paid_at: Time.current)
  end

  # Пометить как отмененный
  def mark_as_cancelled!
    update!(status: 'cancelled')
  end

  # Пометить как неудавшийся
  def mark_as_failed!
    update!(status: 'failed')
  end

  # Итоговая сумма с учетом скидки
  def final_amount
    return amount unless discount_amount.present? && discount_amount > 0
    amount - discount_amount
  end

  private

  # Расчет суммы скидки
  def calculate_discount_amount
    return unless discount_type.present? && discount_value.present?

    self.discount_amount = case discount_type
                           when 'percent'
                             # Процентная скидка
                             (amount * discount_value / 100).round(2)
                           when 'amount'
                             # Фиксированная скидка
                             [discount_value, amount].min # Скидка не может быть больше суммы
                           else
                             0
                           end
  end
end
