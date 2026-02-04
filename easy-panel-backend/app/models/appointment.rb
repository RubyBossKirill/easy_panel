class Appointment < ApplicationRecord
  belongs_to :client
  belongs_to :employee, class_name: 'User'
  belongs_to :time_slot, optional: true

  validates :date, :time, :duration, :status, presence: true
  validates :status, inclusion: { in: %w[pending confirmed cancelled completed] }
  validates :duration, numericality: { greater_than: 0 }

  scope :upcoming, -> { where('date >= ?', Date.today).order(date: :asc, time: :asc) }
  scope :by_status, ->(status) { where(status: status) }
  scope :for_employee, ->(employee_id) { where(employee_id: employee_id) }
end
