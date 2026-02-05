# Easy Panel - Архитектура проекта

## 📊 Обзор

Easy Panel - система управления записями клиентов для психолога с расписанием, платежами, сертификатами и абонементами.

**Версия:** 1.0.0
**Дата создания:** 04.02.2026

---

## 🏗️ Технический стек

### Backend
- **Framework:** Ruby on Rails 7.1.6
- **Database:** PostgreSQL 14
- **Authentication:** JWT (access_token + refresh_token)
- **Authorization:** Role-based permissions
- **API:** REST API v1 (JSON)
- **Background Jobs:** Sidekiq (TODO)
- **Email:** Action Mailer (TODO: настроить SMTP)

### Frontend
- **Framework:** React 18
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Routing:** React Router v6
- **HTTP Client:** Axios wrapper (apiClient)
- **State:** useState + Context (TODO: React Query для кэширования)

### DevOps
- **Containers:** Docker + Docker Compose
- **Reverse Proxy:** Traefik v2 (SSL termination)
- **CI/CD:** GitHub Actions
- **Hosting:** VPS (bulatova-psy.ru)

---

## 🗄️ Модель данных

### User (Пользователь)
```ruby
User {
  id: integer
  email: string (unique, required)
  password_digest: string (bcrypt)
  name: string (required)
  phone: string (optional)
  telegram: string (optional)
  role_id: integer (foreign key → Role)
  created_at: datetime
  updated_at: datetime
}
```

**Ассоциации:**
- `belongs_to :role`
- `has_many :clients` (created_by)
- `has_many :appointments` (as employee)
- `has_many :time_slots`
- `has_many :refresh_tokens`

**Методы:**
- `has_permission?(permission)` - проверка наличия права

---

### Role (Роль)
```ruby
Role {
  id: integer
  name: string (unique, required)
  permissions: jsonb (array of strings)
  is_owner: boolean (default: false)
  created_at: datetime
  updated_at: datetime
}
```

**Роли по умолчанию:**
1. **Владелец** (Owner) - все права
2. **Администратор** (Admin) - все кроме управления владельцами
3. **Сотрудник** (Employee) - базовые права (свои клиенты и записи)

**Права (Permissions):**
```ruby
PERMISSIONS = [
  # Dashboard & Analytics
  'view_dashboard',          # Просмотр главной панели
  'view_analytics',          # Просмотр аналитики

  # Schedule
  'manage_schedule',         # Управление расписанием (time_slots, appointments)

  # Clients
  'view_clients',            # Просмотр своих клиентов
  'manage_clients',          # Создание/редактирование своих клиентов
  'delete_clients',          # Удаление клиентов
  'view_all_clients',        # Просмотр всех клиентов
  'manage_all_clients',      # Редактирование всех клиентов

  # Payments
  'view_payments',           # Просмотр своих платежей
  'manage_payments',         # Создание платежей
  'view_all_payments',       # Просмотр всех платежей
  'manage_all_payments',     # Управление всеми платежами

  # Users & Roles
  'manage_users',            # Управление пользователями (CRUD)
  'delete_users',            # Удаление пользователей (только Owner + Admin)
  'manage_roles',            # Управление ролями

  # Settings
  'manage_account_settings', # Настройки аккаунта
  'manage_payment_settings', # Настройки платёжной системы

  # Advanced Features (TODO)
  'manage_certificates',     # Управление сертификатами
  'manage_subscriptions',    # Управление абонементами
  'manage_discounts',        # Управление скидками
]
```

---

### Client (Клиент)
```ruby
Client {
  id: integer
  name: string (required)
  email: string (unique if present)
  phone: string (optional)
  telegram: string (optional)
  notes: text (optional)
  created_by: integer (foreign key → User)
  created_at: datetime
  updated_at: datetime
}
```

**Ассоциации:**
- `belongs_to :creator, class_name: 'User', foreign_key: 'created_by'`
- `has_many :appointments`
- `has_many :payments`
- `has_many :client_subscriptions` (TODO)

---

### Appointment (Запись/Встреча)
```ruby
Appointment {
  id: integer
  client_id: integer (foreign key → Client, required)
  employee_id: integer (foreign key → User, required)
  time_slot_id: integer (foreign key → TimeSlot, optional)
  date: date (required)
  time: string (required, format: "HH:MM")
  duration: integer (required, minutes)
  service: string (required)
  status: enum (pending, confirmed, cancelled, completed)
  notes: text (optional)
  created_at: datetime
  updated_at: datetime
}
```

**Статусы:**
- `pending` - ожидает подтверждения
- `confirmed` - подтверждена
- `cancelled` - отменена
- `completed` - завершена

**Ассоциации:**
- `belongs_to :client`
- `belongs_to :employee, class_name: 'User'`
- `belongs_to :time_slot, optional: true`
- `has_one :payment`

---

### TimeSlot (Временной слот)
```ruby
TimeSlot {
  id: integer
  employee_id: integer (foreign key → User, required)
  appointment_id: integer (foreign key → Appointment, optional)
  date: date (required)
  time: string (required, format: "HH:MM")
  duration: integer (required, minutes)
  available: boolean (default: true)
  created_at: datetime
  updated_at: datetime
}
```

**Ассоциации:**
- `belongs_to :employee, class_name: 'User'`
- `belongs_to :appointment, optional: true`

---

### Payment (Платеж)
```ruby
Payment {
  id: integer
  client_id: integer (foreign key → Client, required)
  appointment_id: integer (foreign key → Appointment, optional)
  employee_id: integer (foreign key → User, required)
  amount: decimal (required, precision: 10, scale: 2)
  service: string (required)
  paid_at: datetime (required)
  payment_method: enum (cash, card, online) (TODO)
  external_id: string (optional, для Prodamus)
  created_at: datetime
  updated_at: datetime
}
```

**Ассоциации:**
- `belongs_to :client`
- `belongs_to :appointment, optional: true`
- `belongs_to :employee, class_name: 'User'`

---

### RefreshToken (Refresh токен)
```ruby
RefreshToken {
  id: integer
  user_id: integer (foreign key → User)
  token: string (encrypted)
  device_info: string (encrypted, optional)
  ip_address: string (encrypted, optional)
  expires_at: datetime (default: 30 days from now)
  revoked_at: datetime (optional)
  created_at: datetime
  updated_at: datetime
}
```

---

## 🚀 Будущие модели (TODO)

### Certificate (Сертификат)
```ruby
Certificate {
  id: integer
  client_id: integer
  code: string (unique)
  amount: decimal
  initial_amount: decimal
  purchased_at: datetime
  expires_at: datetime
  status: enum (active, used, expired)
  created_at: datetime
  updated_at: datetime
}
```

### Subscription (Абонемент)
```ruby
Subscription {
  id: integer
  name: string
  sessions_count: integer
  duration_days: integer
  price: decimal
  discount_percent: decimal (optional)
  is_active: boolean
  created_at: datetime
  updated_at: datetime
}
```

### ClientSubscription (Абонемент клиента)
```ruby
ClientSubscription {
  id: integer
  client_id: integer
  subscription_id: integer
  purchased_at: datetime
  expires_at: datetime
  sessions_used: integer
  sessions_total: integer
  status: enum (active, expired, cancelled)
  created_at: datetime
  updated_at: datetime
}
```

### Discount (Скидка)
```ruby
Discount {
  id: integer
  client_id: integer
  name: string
  percent: decimal
  starts_at: datetime
  expires_at: datetime
  is_active: boolean
  created_at: datetime
  updated_at: datetime
}
```

### AnalyticsEvent (События для аналитики)
```ruby
AnalyticsEvent {
  id: integer
  event_type: string
  user_id: integer (optional)
  client_id: integer (optional)
  metadata: jsonb
  created_at: datetime
}
```

---

## 🔐 Система авторизации

### JWT Authentication
- **Access Token:** Живёт 24 часа, используется для API запросов
- **Refresh Token:** Живёт 30 дней, хранится в БД, используется для обновления access token

### Flow:
1. POST /auth/login → возвращает access_token + refresh_token
2. Все API запросы: `Authorization: Bearer <access_token>`
3. При истечении access_token (401) → POST /auth/refresh с refresh_token
4. Получаем новую пару токенов
5. POST /auth/logout → отзываем все refresh токены пользователя

### Проверка прав:
```ruby
# В контроллере
before_action :authenticate_request  # Проверка JWT
before_action :check_permission      # Проверка прав

def check_permission
  unless current_user.has_permission?('manage_users')
    render json: { error: 'Insufficient permissions' }, status: :forbidden
  end
end
```

---

## 📡 API Endpoints

### Authentication
```
POST   /api/v1/auth/login          - Вход
POST   /api/v1/auth/register       - Регистрация
POST   /api/v1/auth/refresh        - Обновление токена
POST   /api/v1/auth/logout         - Выход
GET    /api/v1/auth/me             - Текущий пользователь
```

### Users
```
GET    /api/v1/users               - Список пользователей (manage_users)
GET    /api/v1/users/:id           - Профиль пользователя
POST   /api/v1/users               - Создание пользователя (manage_users)
PUT    /api/v1/users/:id           - Обновление пользователя
DELETE /api/v1/users/:id           - Удаление пользователя (delete_users)
```

### Clients (TODO)
```
GET    /api/v1/clients             - Список клиентов
GET    /api/v1/clients/:id         - Профиль клиента
POST   /api/v1/clients             - Создание клиента
PUT    /api/v1/clients/:id         - Обновление клиента
DELETE /api/v1/clients/:id         - Удаление клиента
```

### Appointments (TODO)
```
GET    /api/v1/appointments        - Список встреч
GET    /api/v1/appointments/:id    - Детали встречи
POST   /api/v1/appointments        - Создание встречи
PUT    /api/v1/appointments/:id    - Обновление встречи
DELETE /api/v1/appointments/:id    - Удаление встречи
PATCH  /api/v1/appointments/:id/confirm  - Подтверждение
PATCH  /api/v1/appointments/:id/complete - Завершение
PATCH  /api/v1/appointments/:id/cancel   - Отмена
```

### TimeSlots (TODO)
```
GET    /api/v1/time_slots          - Список слотов
POST   /api/v1/time_slots          - Создание слота
POST   /api/v1/time_slots/bulk     - Массовое создание
PUT    /api/v1/time_slots/:id      - Обновление слота
DELETE /api/v1/time_slots/:id      - Удаление слота
```

### Payments (TODO)
```
GET    /api/v1/payments            - Список платежей
POST   /api/v1/payments            - Создание платежа
GET    /api/v1/payments/stats      - Статистика платежей
```

### Roles
```
GET    /api/v1/roles               - Список ролей
GET    /api/v1/roles/:id           - Детали роли
POST   /api/v1/roles               - Создание роли (Owner only)
PUT    /api/v1/roles/:id           - Обновление роли (Owner only)
DELETE /api/v1/roles/:id           - Удаление роли (Owner only)
```

---

## 💳 Интеграция с Prodamus (TODO)

### Webhook endpoints:
```
POST /api/v1/webhooks/prodamus/payment   - Уведомление об оплате
POST /api/v1/webhooks/prodamus/refund    - Уведомление о возврате
```

### Flow оплаты:
1. Клиент нажимает "Оплатить"
2. Frontend создаёт платёж: POST /api/v1/payments
3. Backend генерирует ссылку на Prodamus с external_id
4. Клиент переходит на Prodamus и оплачивает
5. Prodamus отправляет webhook на /webhooks/prodamus/payment
6. Backend обновляет статус платежа и создаёт запись

---

## 🎨 Frontend архитектура

### Структура папок:
```
src/
├── api/
│   ├── apiClient.ts          # HTTP клиент с автоматическим refresh
│   └── auth.ts               # Утилиты аутентификации
├── components/
│   ├── AdminLayout.tsx       # Layout с навигацией
│   └── ...                   # Другие компоненты
├── pages/
│   ├── Login.tsx             # Страница входа
│   ├── Register.tsx          # Страница регистрации
│   ├── Dashboard.tsx         # Главная панель
│   ├── Schedule.tsx          # Расписание
│   ├── Clients.tsx           # Список клиентов
│   ├── Profile.tsx           # Профиль пользователя
│   ├── Settings.tsx          # Настройки
│   └── Analytics.tsx         # Аналитика (TODO)
├── types/
│   └── index.ts              # TypeScript типы
└── utils/
    ├── permissions.ts        # Проверка прав
    └── dateUtils.ts          # Работа с датами
```

### Защита маршрутов:
```typescript
<Route element={<ProtectedRoute />}>
  <Route element={<RequirePermission permission="view_dashboard" />}>
    <Route path="/dashboard" element={<Dashboard />} />
  </Route>
  <Route element={<RequirePermission permission="manage_users" />}>
    <Route path="/settings" element={<Settings />} />
  </Route>
</Route>
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions workflow:
1. **Trigger:** Push в ветку `main`
2. **Build:**
   - Build backend image
   - Build frontend image (с REACT_APP_API_URL)
3. **Push:** Образы в GitHub Container Registry
4. **Deploy:**
   - SSH подключение к серверу
   - Docker pull новых образов
   - rails db:migrate (если есть миграции)
   - docker compose up -d (zero-downtime)
   - docker image prune (очистка старых образов)

### Переменные окружения (GitHub Secrets):
- `SERVER_HOST`: IP сервера
- `SERVER_USER`: root
- `SERVER_PASSWORD`: пароль SSH

---

## 📊 Аналитика (TODO)

### Метрики для отслеживания:
1. **Записи:**
   - Количество записей по дням/неделям/месяцам
   - Conversion rate (pending → confirmed → completed)
   - Среднее время между записями
   - Популярные услуги

2. **Клиенты:**
   - Новые клиенты по периодам
   - LTV (Lifetime Value) клиента
   - Churn rate (отток клиентов)
   - Повторные визиты

3. **Финансы:**
   - Выручка по периодам
   - Средний чек
   - Доход по сотрудникам
   - Доход по услугам

4. **Сотрудники:**
   - Количество встреч
   - Выручка
   - Загруженность (% заполненных слотов)

### Dashboards:
- **Owner:** Полная аналитика (выручка, клиенты, сотрудники)
- **Admin:** Аналитика по клиентам и записям
- **Employee:** Только свои метрики

---

## 🔒 Безопасность

### Меры безопасности:
1. **Аутентификация:**
   - JWT токены
   - bcrypt для хэширования паролей
   - Refresh tokens в БД
   - Rate limiting на логин (TODO)

2. **Авторизация:**
   - Role-based permissions
   - Проверка прав на уровне контроллера
   - Изоляция данных (сотрудники видят только свои клиенты)

3. **API:**
   - CORS настроен
   - Валидация входных данных
   - SQL injection защита (ActiveRecord)
   - XSS защита (React escaping)

4. **Infrastructure:**
   - SSL/TLS (Traefik + Let's Encrypt)
   - Encrypted environment variables
   - Docker security (non-root users TODO)

---

## 📝 Соглашения о коде

### Backend (Rails):
- Используем Strong Parameters
- Валидация на уровне модели
- Scopes для часто используемых запросов
- Concerns для переиспользуемой логики
- JSON ответы в формате: `{ status: true, data: {...} }`

### Frontend (React):
- Функциональные компоненты + Hooks
- TypeScript для type safety
- Именование: PascalCase для компонентов, camelCase для функций
- Папки: lowercase с дефисами
- Props интерфейсы: `<ComponentName>Props`

### Git:
- Коммиты на английском
- Формат: "Add feature X", "Fix bug in Y", "Update Z"
- Co-authored-by для AI помощи

---

## 🚦 Статус разработки

### ✅ Готово:
- Backend: Models, Auth, Users CRUD
- Frontend: Login, Register, основные страницы
- DevOps: Docker, CI/CD, Traefik
- Права доступа: Role-based permissions

### 🔄 В процессе:
- Backend: Clients, Appointments, TimeSlots, Payments контроллеры
- Frontend: Подключение к реальному API

### 📋 TODO:
- Email (Action Mailer + SMTP)
- Two-Factor Authentication
- Certificates & Subscriptions
- Discounts
- Analytics dashboard
- Prodamus integration
- Tests (RSpec, Jest)

---

**Автор:** Claude Sonnet 4.5
**Дата последнего обновления:** 05.02.2026
