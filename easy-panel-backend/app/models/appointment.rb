class Appointment < ApplicationRecord
  belongs_to :client
  belongs_to :employee, class_name: 'User'
  belongs_to :time_slot, optional: true
  belongs_to :service, optional: true
  has_one :payment, dependent: :destroy

  # Возможные статусы: nil (запланировано), 'completed', 'cancelled'
  STATUSES = %w[completed cancelled].freeze

  validates :date, :time, :duration, presence: true
  validates :status, inclusion: { in: STATUSES, allow_nil: true }
  validates :duration, numericality: { greater_than: 0 }
  validate :service_must_be_active, if: :service_id?

  scope :upcoming, -> { where('date >= ?', Date.today).order(date: :asc, time: :asc) }
  scope :by_status, ->(status) { where(status: status) }
  scope :for_employee, ->(employee_id) { where(employee_id: employee_id) }
  scope :scheduled, -> { where(status: nil) } # Запланированные встречи (статус nil)
  scope :completed, -> { where(status: 'completed') }
  scope :cancelled, -> { where(status: 'cancelled') }

  private

  def service_must_be_active
    return unless service

    unless service.is_active?
      errors.add(:service_id, I18n.t('errors.appointment.inactive_service'))
    end
  end
end
