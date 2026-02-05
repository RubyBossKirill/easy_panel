class CreateServices < ActiveRecord::Migration[7.1]
  def change
    create_table :services do |t|
      t.string :name, null: false
      t.text :description
      t.references :employee, null: false, foreign_key: { to_table: :users }
      t.decimal :price, precision: 10, scale: 2, null: false
      t.integer :duration, null: false, default: 60
      t.boolean :is_active, default: true, null: false

      t.timestamps
    end

    add_index :services, [:employee_id, :name], unique: true
  end
end
