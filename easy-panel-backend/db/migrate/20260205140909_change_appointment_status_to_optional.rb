class ChangeAppointmentStatusToOptional < ActiveRecord::Migration[7.1]
  def change
    change_column_default :appointments, :status, from: 'pending', to: nil
    change_column_null :appointments, :status, true
  end
end
