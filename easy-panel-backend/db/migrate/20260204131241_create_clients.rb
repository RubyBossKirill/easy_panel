class CreateClients < ActiveRecord::Migration[7.1]
  def change
    create_table :clients do |t|
      t.string :name
      t.string :email
      t.string :phone
      t.string :telegram
      t.text :notes
      t.integer :created_by

      t.timestamps
    end
  end
end
