class Role < ApplicationRecord
  has_many :users, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: true
  validates :permissions, presence: true

  # Default permissions
  PERMISSIONS = %w[
    view_dashboard
    manage_schedule
    view_clients
    manage_clients
    view_payments
    manage_payments
    view_all_clients
    manage_all_clients
    view_all_payments
    manage_all_payments
    manage_users
    manage_roles
    manage_account_settings
    manage_payment_settings
  ].freeze
end
