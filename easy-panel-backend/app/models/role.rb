class Role < ApplicationRecord
  has_many :users, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: true
  validates :permissions, presence: true

  # Default permissions
  PERMISSIONS = %w[
    view_dashboard
    view_analytics
    manage_schedule
    view_clients
    manage_clients
    delete_clients
    view_payments
    manage_payments
    view_all_clients
    manage_all_clients
    view_all_payments
    manage_all_payments
    manage_users
    delete_users
    manage_roles
    manage_account_settings
    manage_payment_settings
    manage_certificates
    manage_subscriptions
    manage_discounts
  ].freeze
end
