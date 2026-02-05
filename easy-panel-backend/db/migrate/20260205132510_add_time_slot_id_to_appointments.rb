class AddTimeSlotIdToAppointments < ActiveRecord::Migration[7.1]
  def change
    add_reference :appointments, :time_slot, foreign_key: true, null: true
  end
end
