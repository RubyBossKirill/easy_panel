class AddServiceIdToAppointments < ActiveRecord::Migration[7.1]
  def change
    add_reference :appointments, :service, foreign_key: true, null: true
  end
end
