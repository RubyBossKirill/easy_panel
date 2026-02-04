# Clear existing data in development
if Rails.env.development?
  puts "Clearing existing data..."
  User.destroy_all
  Role.destroy_all
  Client.destroy_all
  Appointment.destroy_all
  TimeSlot.destroy_all
  Payment.destroy_all
end

puts "Creating roles..."

# Create roles
owner_role = Role.find_or_create_by!(name: 'Владелец') do |role|
  role.permissions = Role::PERMISSIONS
  role.is_owner = true
end

admin_role = Role.find_or_create_by!(name: 'Администратор') do |role|
  role.permissions = %w[
    view_dashboard
    manage_schedule
    view_clients
    manage_clients
    view_payments
    manage_payments
    view_all_clients
    manage_all_clients
    view_all_payments
    manage_all_payments
    manage_users
    manage_roles
  ]
  role.is_owner = false
end

employee_role = Role.find_or_create_by!(name: 'Сотрудник') do |role|
  role.permissions = %w[
    view_dashboard
    manage_schedule
    view_clients
    manage_clients
    view_payments
    manage_payments
  ]
  role.is_owner = false
end

puts "Creating users..."

# Create users
owner = User.find_or_create_by!(email: 'owner@company.com') do |user|
  user.name = 'Иван Иванов'
  user.password = '12345678'
  user.password_confirmation = '12345678'
  user.role = owner_role
end

admin = User.find_or_create_by!(email: 'anna@company.com') do |user|
  user.name = 'Анна Смирнова'
  user.password = '12345678'
  user.password_confirmation = '12345678'
  user.role = admin_role
end

employee = User.find_or_create_by!(email: 'mike@company.com') do |user|
  user.name = 'Михаил Петров'
  user.password = '12345678'
  user.password_confirmation = '12345678'
  user.role = employee_role
end

puts "Creating clients..."

# Create sample clients
clients = [
  {
    name: 'Анна Петрова',
    email: 'anna.petrova@email.com',
    phone: '+7 (999) 123-45-67',
    telegram: 'https://t.me/annapetrov',
    notes: 'Постоянный клиент, предпочитает утренние часы',
    created_by: owner.id
  },
  {
    name: 'Михаил Сидоров',
    email: 'mikhail.sidorov@email.com',
    phone: '+7 (999) 234-56-78',
    telegram: 'https://t.me/mikesidorov',
    notes: 'Интересуется новыми услугами',
    created_by: admin.id
  },
  {
    name: 'Елена Козлова',
    email: 'elena.kozlova@email.com',
    phone: '+7 (999) 345-67-89',
    telegram: 'https://t.me/elenakozlova',
    notes: 'Не посещала более месяца',
    created_by: employee.id
  }
]

created_clients = clients.map do |client_data|
  Client.find_or_create_by!(email: client_data[:email]) do |client|
    client.assign_attributes(client_data)
  end
end

puts "Creating appointments..."

# Create sample appointments
Appointment.find_or_create_by!(
  client: created_clients[0],
  employee: employee,
  date: Date.today,
  time: '14:00'
) do |apt|
  apt.duration = 60
  apt.service = 'Консультация'
  apt.status = 'confirmed'
end

Appointment.find_or_create_by!(
  client: created_clients[1],
  employee: employee,
  date: Date.today + 1,
  time: '10:00'
) do |apt|
  apt.duration = 60
  apt.service = 'Первичная встреча'
  apt.status = 'pending'
end

puts "Seed data created successfully!"
puts "\nTest accounts:"
puts "Owner: owner@company.com / 12345678"
puts "Admin: anna@company.com / 12345678"
puts "Employee: mike@company.com / 12345678"
