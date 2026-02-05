class AddIsOwnerToRoles < ActiveRecord::Migration[7.1]
  def change
    add_column :roles, :is_owner, :boolean, default: false, null: false
  end
end
