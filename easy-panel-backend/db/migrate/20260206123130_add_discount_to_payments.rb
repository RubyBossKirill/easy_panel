class AddDiscountToPayments < ActiveRecord::Migration[7.1]
  def change
    add_column :payments, :discount_type, :string # 'percent' или 'amount'
    add_column :payments, :discount_value, :decimal, precision: 10, scale: 2 # Значение скидки (% или сумма)
    add_column :payments, :discount_amount, :decimal, precision: 10, scale: 2 # Рассчитанная сумма скидки
  end
end
