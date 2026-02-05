# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2026_02_05_071547) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "appointments", force: :cascade do |t|
    t.bigint "client_id", null: false
    t.bigint "employee_id", null: false
    t.date "date", null: false
    t.time "time", null: false
    t.integer "duration", null: false
    t.string "service"
    t.string "status", default: "pending", null: false
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["client_id"], name: "index_appointments_on_client_id"
    t.index ["employee_id", "date"], name: "index_appointments_on_employee_id_and_date"
    t.index ["employee_id"], name: "index_appointments_on_employee_id"
    t.index ["status"], name: "index_appointments_on_status"
  end

  create_table "clients", force: :cascade do |t|
    t.string "name"
    t.string "email"
    t.string "phone"
    t.string "telegram"
    t.text "notes"
    t.integer "created_by"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "payments", force: :cascade do |t|
    t.bigint "client_id", null: false
    t.bigint "appointment_id", null: false
    t.decimal "amount"
    t.string "service"
    t.integer "employee_id"
    t.datetime "paid_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["appointment_id"], name: "index_payments_on_appointment_id"
    t.index ["client_id"], name: "index_payments_on_client_id"
  end

  create_table "refresh_tokens", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "token", null: false
    t.datetime "expires_at", null: false
    t.boolean "revoked", default: false, null: false
    t.string "device_info"
    t.string "ip_address"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["token"], name: "index_refresh_tokens_on_token", unique: true
    t.index ["user_id", "revoked"], name: "index_refresh_tokens_on_user_id_and_revoked"
    t.index ["user_id"], name: "index_refresh_tokens_on_user_id"
  end

  create_table "roles", force: :cascade do |t|
    t.string "name", null: false
    t.jsonb "permissions", default: [], null: false
    t.boolean "is_owner", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_roles_on_name", unique: true
  end

  create_table "time_slots", force: :cascade do |t|
    t.bigint "employee_id", null: false
    t.date "date", null: false
    t.time "time", null: false
    t.integer "duration", null: false
    t.boolean "available", default: true
    t.bigint "appointment_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["appointment_id"], name: "index_time_slots_on_appointment_id"
    t.index ["employee_id", "date", "time"], name: "index_time_slots_on_employee_id_and_date_and_time"
    t.index ["employee_id"], name: "index_time_slots_on_employee_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "name", null: false
    t.bigint "role_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "phone"
    t.string "telegram"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["role_id"], name: "index_users_on_role_id"
  end

  add_foreign_key "appointments", "clients"
  add_foreign_key "appointments", "users", column: "employee_id"
  add_foreign_key "payments", "appointments"
  add_foreign_key "payments", "clients"
  add_foreign_key "refresh_tokens", "users"
  add_foreign_key "time_slots", "appointments"
  add_foreign_key "time_slots", "users", column: "employee_id"
  add_foreign_key "users", "roles"
end
