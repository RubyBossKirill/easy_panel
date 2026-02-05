# Easy Panel - План разработки

## 📊 Текущий статус

### ✅ Готово (Деплой работает)
- [x] Backend API (Rails 7.1 + PostgreSQL)
- [x] Frontend (React 18 + TypeScript + TailwindCSS)
- [x] Базовая аутентификация (JWT с access/refresh tokens)
- [x] Роли и права доступа (Owner, Admin, Employee)
- [x] Docker контейнеризация (backend, frontend, postgres, adminer)
- [x] GitHub Actions автодеплой
- [x] Traefik reverse proxy с SSL
- [x] Модели: User, Client, Appointment, TimeSlot, Payment, Role, RefreshToken
- [x] Seed данные (3 тестовых пользователя)

### 🔄 В процессе
- [ ] Интеграция фронтенда с бэкенд API (используются mock-данные)

---

## 🎯 Roadmap

### Phase 1: Backend API Controllers (Критично)

**Цель:** Создать полноценные CRUD контроллеры для всех ресурсов

#### 1.1 Users Controller
- [ ] `GET /api/v1/users` - список пользователей (требует права `manage_users`)
- [ ] `GET /api/v1/users/:id` - профиль пользователя
- [ ] `POST /api/v1/users` - создание пользователя (требует права `manage_users`)
- [ ] `PUT /api/v1/users/:id` - обновление пользователя
- [ ] `DELETE /api/v1/users/:id` - удаление пользователя (требует права `manage_users`)
- [ ] Фильтры: по роли, активности, дате создания
- [ ] Валидация: уникальность email, сила пароля

#### 1.2 Clients Controller
- [ ] `GET /api/v1/clients` - список клиентов
- [ ] `GET /api/v1/clients/:id` - детали клиента с историей встреч
- [ ] `POST /api/v1/clients` - создание клиента
- [ ] `PUT /api/v1/clients/:id` - обновление клиента
- [ ] `DELETE /api/v1/clients/:id` - удаление клиента
- [ ] Фильтры: поиск по имени/email/телефону
- [ ] Пагинация (25 на страницу)
- [ ] Сортировка: по имени, дате создания, количеству встреч

#### 1.3 Appointments Controller
- [ ] `GET /api/v1/appointments` - список встреч
- [ ] `GET /api/v1/appointments/:id` - детали встречи
- [ ] `POST /api/v1/appointments` - создание встречи
- [ ] `PUT /api/v1/appointments/:id` - обновление встречи
- [ ] `DELETE /api/v1/appointments/:id` - отмена встречи
- [ ] `PATCH /api/v1/appointments/:id/confirm` - подтверждение встречи
- [ ] `PATCH /api/v1/appointments/:id/complete` - завершение встречи
- [ ] `PATCH /api/v1/appointments/:id/cancel` - отмена встречи
- [ ] Фильтры: по статусу, дате, сотруднику, клиенту
- [ ] Права доступа: сотрудники видят только свои встречи

#### 1.4 TimeSlots Controller
- [ ] `GET /api/v1/time_slots` - доступные слоты
- [ ] `GET /api/v1/time_slots/:id` - детали слота
- [ ] `POST /api/v1/time_slots` - создание слота
- [ ] `PUT /api/v1/time_slots/:id` - обновление слота
- [ ] `DELETE /api/v1/time_slots/:id` - удаление слота
- [ ] `POST /api/v1/time_slots/bulk` - массовое создание слотов (на неделю/месяц)
- [ ] Фильтры: по дате, сотруднику, доступности
- [ ] Валидация: проверка пересечений слотов

#### 1.5 Payments Controller
- [ ] `GET /api/v1/payments` - список платежей
- [ ] `GET /api/v1/payments/:id` - детали платежа
- [ ] `POST /api/v1/payments` - создание платежа
- [ ] Фильтры: по дате, клиенту, сотруднику
- [ ] Статистика: сумма за период, по услугам
- [ ] Экспорт данных (CSV)

#### 1.6 Roles Controller
- [ ] `GET /api/v1/roles` - список ролей
- [ ] `GET /api/v1/roles/:id` - детали роли
- [ ] `POST /api/v1/roles` - создание роли (Owner only)
- [ ] `PUT /api/v1/roles/:id` - обновление роли (Owner only)
- [ ] `DELETE /api/v1/roles/:id` - удаление роли (Owner only)

---

### Phase 2: Frontend API Integration (Критично)

**Цель:** Заменить все mock-данные на реальные API вызовы

#### 2.1 Dashboard
- [ ] Подключить `/api/v1/appointments?status=pending` для "Ожидают подтверждения"
- [ ] Подключить `/api/v1/appointments?date=today` для "Записи на сегодня"
- [ ] Подключить `/api/v1/time_slots?available=true&date=today` для "Доступные слоты"
- [ ] Добавить статистику: GET `/api/v1/stats/summary`
- [ ] Real-time обновление через polling (каждые 30 сек)

#### 2.2 Schedule (Расписание)
- [ ] GET `/api/v1/time_slots?date=:date` для загрузки слотов
- [ ] POST `/api/v1/time_slots` для создания нового слота
- [ ] PUT `/api/v1/time_slots/:id` для редактирования
- [ ] DELETE `/api/v1/time_slots/:id` для удаления
- [ ] Drag & drop для изменения времени встреч
- [ ] Календарь с навигацией по неделям/месяцам
- [ ] Цветовая кодировка: свободен/занят/завершен/отменен

#### 2.3 Clients (Клиенты)
- [ ] GET `/api/v1/clients` с пагинацией и поиском
- [ ] POST `/api/v1/clients` для добавления нового клиента
- [ ] PUT `/api/v1/clients/:id` для редактирования
- [ ] DELETE `/api/v1/clients/:id` для удаления
- [ ] Модальное окно для создания/редактирования
- [ ] Поиск в реальном времени (debounce 300ms)
- [ ] Сортировка по колонкам

#### 2.4 Client Profile
- [ ] GET `/api/v1/clients/:id` для полной информации
- [ ] GET `/api/v1/appointments?client_id=:id` для истории встреч
- [ ] GET `/api/v1/payments?client_id=:id` для истории платежей
- [ ] Форма редактирования клиента
- [ ] Кнопка "Записать на прием"
- [ ] График встреч и платежей

#### 2.5 Payments (Новая страница)
- [ ] Создать `src/pages/Payments.tsx`
- [ ] GET `/api/v1/payments` с фильтрами
- [ ] POST `/api/v1/payments` для записи платежа
- [ ] Таблица с сортировкой и пагинацией
- [ ] Фильтры: дата, клиент, сотрудник, услуга
- [ ] Статистика: сумма за период
- [ ] Экспорт в CSV

#### 2.6 Profile (Профиль пользователя)
- [ ] GET `/api/v1/auth/me` для текущих данных
- [ ] PUT `/api/v1/users/:id` для обновления профиля
- [ ] Смена пароля (отдельный endpoint)
- [ ] Загрузка аватара (если будет функционал)

#### 2.7 Settings & Account Settings
- [ ] GET `/api/v1/users` для списка пользователей
- [ ] POST `/api/v1/users` для создания пользователя
- [ ] PUT `/api/v1/users/:id` для редактирования
- [ ] DELETE `/api/v1/users/:id` для удаления
- [ ] GET `/api/v1/roles` для управления ролями
- [ ] Системные настройки (хранить в ENV или отдельной таблице)

---

### Phase 3: Email & Two-Factor Authentication (Важно)

**Цель:** Настроить email-уведомления и двухфакторную аутентификацию

#### 3.1 Email Setup
- [ ] Подключить доменную почту (например: `noreply@bulatova-psy.ru`)
- [ ] Настроить SMTP в Rails:
  - Gmail SMTP (dev)
  - SendGrid/Postmark/AWS SES (production)
- [ ] Добавить Action Mailer конфигурацию
- [ ] Создать email templates:
  - Welcome email при регистрации
  - Подтверждение email (verification)
  - Сброс пароля
  - Уведомление о новой встрече
  - Напоминание о встрече (за 24 часа)
  - 2FA код

#### 3.2 Email Verification
- [ ] Добавить поле `email_verified` в модель User
- [ ] Генерация verification token
- [ ] Endpoint `POST /api/v1/auth/verify-email`
- [ ] Endpoint `POST /api/v1/auth/resend-verification`
- [ ] UI для статуса верификации
- [ ] Ограничение функционала для неверифицированных пользователей

#### 3.3 Password Reset
- [ ] Endpoint `POST /api/v1/auth/forgot-password` (отправка кода на email)
- [ ] Endpoint `POST /api/v1/auth/reset-password` (сброс с кодом)
- [ ] Таблица `password_reset_tokens` с expiration
- [ ] UI форма "Забыли пароль?"
- [ ] Email шаблон с кодом сброса

#### 3.4 Two-Factor Authentication (2FA)
- [ ] Добавить поля в User:
  - `two_factor_enabled` (boolean)
  - `two_factor_secret` (encrypted)
- [ ] Таблица `two_factor_codes`:
  - user_id, code (6 цифр), expires_at, used_at
- [ ] Endpoints:
  - `POST /api/v1/auth/2fa/enable` - включение 2FA
  - `POST /api/v1/auth/2fa/disable` - выключение 2FA
  - `POST /api/v1/auth/2fa/verify` - проверка кода
  - `POST /api/v1/auth/2fa/resend` - повторная отправка кода
- [ ] Логика:
  - При входе, если 2FA включен → отправить код на email
  - Пользователь вводит код для завершения входа
  - Код действует 10 минут
  - Максимум 3 попытки ввода
- [ ] UI:
  - Страница ввода 2FA кода
  - Настройки 2FA в профиле (включить/выключить)
  - Checkbox "Запомнить устройство на 30 дней"

#### 3.5 Trusted Devices (опционально)
- [ ] Таблица `trusted_devices`:
  - user_id, device_fingerprint, expires_at
- [ ] Skip 2FA для доверенных устройств
- [ ] Управление доверенными устройствами в профиле

#### 3.6 Email Notifications для событий
- [ ] Новая встреча создана
- [ ] Встреча подтверждена
- [ ] Встреча отменена
- [ ] Напоминание за 24 часа до встречи
- [ ] Напоминание за 1 час до встречи (опционально)
- [ ] Настройки уведомлений в профиле

---

### Phase 4: UI/UX Improvements (Важно)

#### 4.1 Error Handling
- [ ] Глобальный обработчик ошибок API
- [ ] Toast notifications для success/error
- [ ] Валидация форм с отображением ошибок
- [ ] 404/403/500 страницы ошибок

#### 4.2 Loading States
- [ ] Skeleton loaders для таблиц
- [ ] Spinners для кнопок
- [ ] Progress bar для long operations

#### 4.3 Pagination
- [ ] Компонент Pagination
- [ ] "Load more" для бесконечной прокрутки
- [ ] Настройка items per page

#### 4.4 Filters & Search
- [ ] Компонент SearchBar
- [ ] Multi-select фильтры
- [ ] Date range picker
- [ ] Сохранение фильтров в URL query params

#### 4.5 Modals & Dialogs
- [ ] Confirmation dialogs для удаления
- [ ] Modal для создания/редактирования
- [ ] Drawer для деталей объекта

---

### Phase 5: Advanced Features (Улучшения)

#### 5.1 Real-time Updates
- [ ] WebSocket с Action Cable
- [ ] Live updates для dashboard
- [ ] Notifications in real-time
- [ ] Presence indicators (кто онлайн)

#### 5.2 Caching & Performance
- [ ] React Query или SWR для кэширования
- [ ] Redis cache на backend
- [ ] Database indexes оптимизация
- [ ] Lazy loading для компонентов

#### 5.3 Reports & Analytics
- [ ] Страница Reports
- [ ] Графики (Chart.js или Recharts):
  - Количество встреч по дням/неделям/месяцам
  - Выручка по периодам
  - Популярные услуги
  - Эффективность сотрудников
- [ ] Экспорт отчетов в PDF/Excel

#### 5.4 Calendar Integration
- [ ] Google Calendar sync
- [ ] iCal export
- [ ] Import встреч из внешних календарей

#### 5.5 Notifications System
- [ ] In-app notifications (Bell icon)
- [ ] Email notifications
- [ ] Push notifications (PWA)
- [ ] SMS notifications (опционально, Twilio)

#### 5.6 Mobile App (PWA)
- [ ] Service Worker для offline
- [ ] Install prompt
- [ ] Mobile-responsive design улучшения
- [ ] Touch gestures

#### 5.7 Multi-language
- [ ] i18n setup (react-i18next)
- [ ] Русский (по умолчанию)
- [ ] Английский
- [ ] Language switcher в UI

#### 5.8 Dark Mode
- [ ] Toggle в настройках
- [ ] Сохранение предпочтения
- [ ] Dark theme стили

---

### Phase 6: Testing & Quality (Важно)

#### 6.1 Backend Tests
- [ ] RSpec setup
- [ ] Model specs (валидация, ассоциации)
- [ ] Controller specs (API endpoints)
- [ ] Request specs (интеграционные тесты)
- [ ] Authentication specs

#### 6.2 Frontend Tests
- [ ] Jest + React Testing Library setup
- [ ] Component unit tests
- [ ] Integration tests (страницы)
- [ ] E2E tests (Playwright или Cypress)

#### 6.3 Code Quality
- [ ] ESLint + Prettier для frontend
- [ ] RuboCop для backend
- [ ] TypeScript strict mode
- [ ] Code review checklist

---

### Phase 7: DevOps & Monitoring (Важно)

#### 7.1 CI/CD Improvements
- [ ] Run tests в GitHub Actions
- [ ] Lint checks перед деплоем
- [ ] Database migrations автоматически
- [ ] Rollback механизм

#### 7.2 Monitoring
- [ ] Application monitoring (New Relic, Sentry)
- [ ] Error tracking
- [ ] Performance metrics
- [ ] Database query monitoring

#### 7.3 Backups
- [ ] Automated PostgreSQL backups
- [ ] Backup restoration тесты
- [ ] S3 хранение бэкапов

#### 7.4 Security
- [ ] Rate limiting (Rack::Attack)
- [ ] CORS правильная настройка
- [ ] Security headers
- [ ] Vulnerability scanning
- [ ] Dependency updates (Dependabot)

---

### Phase 8: Documentation (Важно)

#### 8.1 API Documentation
- [ ] Swagger/OpenAPI specs
- [ ] Postman collection
- [ ] API versioning strategy

#### 8.2 User Documentation
- [ ] User guide (как пользоваться системой)
- [ ] Admin guide (настройка ролей, управление)
- [ ] FAQ
- [ ] Video tutorials

#### 8.3 Developer Documentation
- [ ] README обновление
- [ ] Setup guide
- [ ] Architecture overview
- [ ] Contributing guide

---

## 🚀 Приоритеты на ближайшее время

### Неделя 1-2: Backend Controllers (CRITICAL)
1. Clients Controller (полный CRUD)
2. Appointments Controller (CRUD + статусы)
3. TimeSlots Controller (CRUD + bulk create)
4. Users Controller (управление пользователями)
5. Payments Controller (создание + список)

### Неделя 3-4: Frontend Integration (CRITICAL)
1. Dashboard → реальные данные
2. Schedule → CRUD операции
3. Clients → CRUD операции
4. Payments → новая страница
5. Profile → редактирование

### Неделя 5-6: Email & 2FA (HIGH PRIORITY)
1. Настройка доменной почты
2. Email templates
3. Email verification
4. Password reset
5. Two-Factor Authentication

### Неделя 7-8: UI/UX Polish (MEDIUM PRIORITY)
1. Error handling & toasts
2. Loading states
3. Pagination & filters
4. Modals & confirmations

---

## 📝 Notes

### Email Providers Options:
- **SendGrid** - 100 emails/day free, $15/mo для 40k emails
- **Postmark** - Transactional emails, $15/mo для 10k emails
- **AWS SES** - $0.10 за 1000 emails, нужна верификация домена
- **Mailgun** - 5000 emails/mo free

### Domain Email Setup:
1. Купить доменную почту (Google Workspace, Yandex Mail for Domain)
2. Настроить MX записи
3. Создать `noreply@bulatova-psy.ru` для системных писем
4. Настроить SPF, DKIM, DMARC для deliverability

### 2FA Implementation Options:
- **Email-based** (проще, но менее безопасно) ✓ Рекомендуем для MVP
- **SMS-based** (Twilio, $0.0075/sms) - дорого для РФ
- **TOTP-based** (Google Authenticator) - сложнее для пользователей
- **Hybrid** - Email по умолчанию + TOTP опционально

---

## 🔗 Полезные ссылки

### Backend (Rails):
- [Action Mailer Guide](https://guides.rubyonrails.org/action_mailer_basics.html)
- [Active Job для background tasks](https://guides.rubyonrails.org/active_job_basics.html)
- [Devise для 2FA](https://github.com/heartcombo/devise-two-factor)

### Frontend (React):
- [React Query](https://tanstack.com/query/latest) для кэширования
- [React Hook Form](https://react-hook-form.com/) для форм
- [React Hot Toast](https://react-hot-toast.com/) для уведомлений
- [Day.js](https://day.js.org/) для работы с датами

### DevOps:
- [Traefik Docs](https://doc.traefik.io/traefik/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
