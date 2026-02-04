class Client < ApplicationRecord
  belongs_to :creator, class_name: 'User', foreign_key: :created_by
  has_many :appointments, dependent: :destroy
  has_many :payments, dependent: :destroy

  validates :name, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true
  validates :phone, format: { with: /\A[\d\s\+\-\(\)]+\z/ }, allow_blank: true
end
