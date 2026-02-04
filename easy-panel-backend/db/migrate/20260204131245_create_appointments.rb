class CreateAppointments < ActiveRecord::Migration[7.1]
  def change
    create_table :appointments do |t|
      t.references :client, null: false, foreign_key: true
      t.references :employee, null: false, foreign_key: { to_table: :users }
      t.date :date, null: false
      t.time :time, null: false
      t.integer :duration, null: false
      t.string :service
      t.string :status, null: false, default: 'pending'
      t.text :notes

      t.timestamps
    end

    add_index :appointments, [:employee_id, :date]
    add_index :appointments, :status
  end
end
