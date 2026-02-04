class TimeSlot < ApplicationRecord
  belongs_to :employee
  belongs_to :appointment
end
