class Service < ApplicationRecord
  belongs_to :employee, class_name: 'User', foreign_key: 'employee_id'

  validates :name, presence: true, uniqueness: { scope: :employee_id }
  validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :duration, presence: true, numericality: { greater_than: 0 }

  scope :active, -> { where(is_active: true) }
  scope :for_employee, ->(employee_id) { where(employee_id: employee_id) }
end
