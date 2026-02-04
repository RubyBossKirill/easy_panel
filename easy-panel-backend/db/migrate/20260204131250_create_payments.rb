class CreatePayments < ActiveRecord::Migration[7.1]
  def change
    create_table :payments do |t|
      t.references :client, null: false, foreign_key: true
      t.references :appointment, null: false, foreign_key: true
      t.decimal :amount
      t.string :service
      t.integer :employee_id
      t.datetime :paid_at

      t.timestamps
    end
  end
end
