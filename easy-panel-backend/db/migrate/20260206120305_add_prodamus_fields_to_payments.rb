class AddProdamusFieldsToPayments < ActiveRecord::Migration[7.1]
  def change
    add_reference :payments, :service, foreign_key: true
    add_column :payments, :prodamus_order_id, :string
    add_column :payments, :payment_link, :text
    add_column :payments, :payment_method, :string, default: 'online'
    add_column :payments, :status, :string, default: 'pending'
    # paid_at уже существует в таблице, пропускаем

    add_index :payments, :prodamus_order_id, unique: true
    add_index :payments, :status
  end
end
