class Appointment < ApplicationRecord
  belongs_to :client
  belongs_to :employee, class_name: 'User'
  belongs_to :time_slot, optional: true
  belongs_to :service, optional: true
  has_one :payment, dependent: :destroy

  validates :date, :time, :duration, presence: true
  validates :status, inclusion: { in: %w[completed cancelled], allow_nil: true }
  validates :duration, numericality: { greater_than: 0 }

  scope :upcoming, -> { where('date >= ?', Date.today).order(date: :asc, time: :asc) }
  scope :by_status, ->(status) { where(status: status) }
  scope :for_employee, ->(employee_id) { where(employee_id: employee_id) }
  scope :scheduled, -> { where(status: nil) } # Запланированные встречи без статуса
  scope :completed, -> { where(status: 'completed') }
  scope :cancelled, -> { where(status: 'cancelled') }
end
