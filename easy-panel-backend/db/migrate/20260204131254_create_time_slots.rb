class CreateTimeSlots < ActiveRecord::Migration[7.1]
  def change
    create_table :time_slots do |t|
      t.references :employee, null: false, foreign_key: { to_table: :users }
      t.date :date, null: false
      t.time :time, null: false
      t.integer :duration, null: false
      t.boolean :available, default: true
      t.references :appointment, foreign_key: true

      t.timestamps
    end

    add_index :time_slots, [:employee_id, :date, :time]
  end
end
