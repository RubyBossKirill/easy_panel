# Easy Panel Backend API

Ruby on Rails API для системы управления записями к сотрудникам.

## 🚀 Технологии

- **Ruby** 3.2.2
- **Rails** 7.1.6
- **PostgreSQL** 14+
- **JWT** для аутентификации
- **BCrypt** для хеширования паролей

## 📦 Установка и запуск

### 1. Установка зависимостей

\`\`\`bash
bundle install
\`\`\`

### 2. Настройка базы данных

\`\`\`bash
rails db:create
rails db:migrate
rails db:seed
\`\`\`

### 3. Запуск сервера

\`\`\`bash
rails server -p 5000
\`\`\`

Сервер доступен: http://localhost:5000

## 🔐 Тестовые аккаунты

- **Владелец**: owner@company.com / 12345678
- **Администратор**: anna@company.com / 12345678
- **Сотрудник**: mike@company.com / 12345678

## 📚 API Endpoints

### POST /api/v1/auth/login - Вход
### POST /api/v1/auth/register - Регистрация
### GET /api/v1/auth/me - Текущий пользователь

### CRUD endpoints:
- /api/v1/users
- /api/v1/clients
- /api/v1/appointments
- /api/v1/time_slots
- /api/v1/payments
- /api/v1/roles
