# 🎯 Easy Panel - Следующие шаги

## ✅ Что уже работает (04.02.2026)

- ✅ **Деплой настроен**: https://panel.bulatova-psy.ru
- ✅ **API работает**: https://api.panel.bulatova-psy.ru/api/v1
- ✅ **База данных**: PostgreSQL с seed данными
- ✅ **Аутентификация**: Login/Register с JWT tokens
- ✅ **Автодеплой**: Git push → GitHub Actions → Production
- ✅ **Docker**: Backend, Frontend, PostgreSQL, Adminer
- ✅ **Traefik**: SSL reverse proxy

### Тестовые аккаунты:
- 👑 Владелец: `owner@company.com` / `12345678`
- 👨‍💼 Админ: `anna@company.com` / `12345678`
- 👤 Сотрудник: `mike@company.com` / `12345678`

---

## 🚀 Что делать дальше

### 1️⃣ Первый приоритет: Backend API Controllers (1-2 недели)

**Проблема:** Фронтенд использует mock-данные вместо реальных API вызовов.

**Задача:** Создать CRUD контроллеры для всех ресурсов.

#### Нужно создать файлы:
```
easy-panel-backend/app/controllers/api/v1/
  ├── clients_controller.rb       # CRUD для клиентов
  ├── appointments_controller.rb  # CRUD для встреч
  ├── time_slots_controller.rb    # CRUD для временных слотов
  ├── payments_controller.rb      # Создание и просмотр платежей
  └── users_controller.rb         # Управление пользователями
```

#### Примерная структура контроллера:

```ruby
# app/controllers/api/v1/clients_controller.rb
class Api::V1::ClientsController < ApplicationController
  before_action :set_client, only: [:show, :update, :destroy]

  # GET /api/v1/clients
  def index
    @clients = Client.all
    # TODO: добавить фильтрацию, пагинацию, поиск
    render json: { status: true, data: @clients }
  end

  # GET /api/v1/clients/:id
  def show
    render json: {
      status: true,
      data: @client.as_json(include: [:appointments, :payments])
    }
  end

  # POST /api/v1/clients
  def create
    @client = Client.new(client_params)
    @client.created_by = current_user.id

    if @client.save
      render json: { status: true, data: @client }, status: :created
    else
      render json: {
        status: false,
        error: @client.errors.full_messages.join(', ')
      }, status: :unprocessable_entity
    end
  end

  # PUT /api/v1/clients/:id
  def update
    if @client.update(client_params)
      render json: { status: true, data: @client }
    else
      render json: {
        status: false,
        error: @client.errors.full_messages.join(', ')
      }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/clients/:id
  def destroy
    @client.destroy
    render json: { status: true, message: 'Клиент удален' }
  end

  private

  def set_client
    @client = Client.find(params[:id])
  end

  def client_params
    params.require(:client).permit(:name, :email, :phone, :telegram, :notes)
  end
end
```

**После создания контроллеров:**
1. Добавить routes в `config/routes.rb`
2. Протестировать через Postman/curl
3. Подключить на фронтенде

---

### 2️⃣ Второй приоритет: Frontend API Integration (2-3 недели)

**Задача:** Заменить все mock-данные на реальные API вызовы.

#### Примерная последовательность:

**Шаг 1: Clients Page**
```typescript
// easy-panel/src/pages/Clients.tsx
import { apiClient } from '../api/apiClient';

// Вместо:
const [clients, setClients] = useState(mockClients);

// Сделать:
useEffect(() => {
  const fetchClients = async () => {
    try {
      const response = await apiClient.get('/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };
  fetchClients();
}, []);
```

**Шаг 2: Schedule Page**
```typescript
// GET /time_slots?date=2024-07-13
const response = await apiClient.get(`/time_slots?date=${selectedDate}`);

// POST /time_slots
await apiClient.post('/time_slots', {
  date: '2024-07-13',
  time: '10:00',
  duration: 60,
  employee_id: currentUser.id
});
```

**Шаг 3: Dashboard**
```typescript
// Загрузка статистики
const [stats, setStats] = useState({});
useEffect(() => {
  Promise.all([
    apiClient.get('/appointments?status=pending'),
    apiClient.get('/appointments?date=today'),
    apiClient.get('/clients'),
    apiClient.get('/time_slots?available=true')
  ]).then(([pending, today, clients, slots]) => {
    setStats({
      pendingCount: pending.data.length,
      todayCount: today.data.length,
      clientsCount: clients.data.length,
      availableSlotsCount: slots.data.length
    });
  });
}, []);
```

---

### 3️⃣ Третий приоритет: Email & 2FA (2 недели)

#### Шаг 1: Настройка доменной почты

**Вариант A: Google Workspace (рекомендуем)**
- Стоимость: $6/месяц за пользователя
- Домен: `bulatova-psy.ru`
- Email: `noreply@bulatova-psy.ru`

**Вариант B: Yandex Mail for Domain (бесплатно)**
- Бесплатно до 1000 писем/день
- Хорошо работает в РФ
- Настройка: https://mail.yandex.ru/

**Настройка DNS записей (у регистратора домена):**
```
MX    10  mx.yandex.net.
TXT   v=spf1 include:_spf.yandex.net ~all
TXT   (DKIM ключ от провайдера)
```

#### Шаг 2: Настройка Rails Action Mailer

```ruby
# config/environments/production.rb
config.action_mailer.delivery_method = :smtp
config.action_mailer.smtp_settings = {
  address: 'smtp.yandex.ru',
  port: 587,
  domain: 'bulatova-psy.ru',
  user_name: ENV['SMTP_USERNAME'], # noreply@bulatova-psy.ru
  password: ENV['SMTP_PASSWORD'],
  authentication: 'plain',
  enable_starttls_auto: true
}
config.action_mailer.default_url_options = {
  host: 'panel.bulatova-psy.ru',
  protocol: 'https'
}
```

Добавить в `.env.easy-panel` на сервере:
```bash
SMTP_USERNAME=noreply@bulatova-psy.ru
SMTP_PASSWORD=ваш_пароль_приложения
```

#### Шаг 3: Email Templates

Создать mailer:
```bash
rails g mailer User welcome verify_email password_reset two_factor_code
```

```ruby
# app/mailers/user_mailer.rb
class UserMailer < ApplicationMailer
  default from: 'Easy Panel <noreply@bulatova-psy.ru>'

  def welcome_email(user)
    @user = user
    mail(to: @user.email, subject: 'Добро пожаловать в Easy Panel!')
  end

  def two_factor_code(user, code)
    @user = user
    @code = code
    mail(to: @user.email, subject: 'Код подтверждения входа')
  end
end
```

Шаблон email:
```erb
<!-- app/views/user_mailer/two_factor_code.html.erb -->
<h1>Код подтверждения</h1>
<p>Здравствуйте, <%= @user.name %>!</p>
<p>Ваш код для входа:</p>
<h2 style="font-size: 36px; letter-spacing: 5px;"><%= @code %></h2>
<p>Код действителен 10 минут.</p>
```

#### Шаг 4: Two-Factor Authentication

**Создать миграцию:**
```bash
rails g migration AddTwoFactorToUsers two_factor_enabled:boolean two_factor_secret:string
```

**Создать модель для кодов:**
```bash
rails g model TwoFactorCode user:references code:string expires_at:datetime used_at:datetime
```

**Логика 2FA:**
```ruby
# app/models/two_factor_code.rb
class TwoFactorCode < ApplicationRecord
  belongs_to :user

  before_create :generate_code

  def self.generate_for_user(user)
    create(user: user, expires_at: 10.minutes.from_now)
  end

  def valid?
    !used? && !expired?
  end

  def used?
    used_at.present?
  end

  def expired?
    expires_at < Time.current
  end

  def mark_as_used!
    update(used_at: Time.current)
  end

  private

  def generate_code
    self.code = rand(100_000..999_999).to_s
  end
end
```

**Обновить AuthController:**
```ruby
def login
  user = User.find_by(email: params[:email]&.downcase)

  if user&.authenticate(params[:password])
    if user.two_factor_enabled?
      # Генерируем и отправляем код
      two_factor_code = TwoFactorCode.generate_for_user(user)
      UserMailer.two_factor_code(user, two_factor_code.code).deliver_later

      render json: {
        status: true,
        requires_2fa: true,
        message: 'Код подтверждения отправлен на email'
      }
    else
      # Обычный вход без 2FA
      tokens = generate_tokens(user)
      render json: { status: true, data: { user: user_response(user), **tokens } }
    end
  else
    render json: { status: false, error: 'Неверный email или пароль' }, status: :unauthorized
  end
end

def verify_two_factor
  user = User.find_by(email: params[:email]&.downcase)
  code = TwoFactorCode.find_by(user: user, code: params[:code])

  if code&.valid?
    code.mark_as_used!
    tokens = generate_tokens(user)
    render json: { status: true, data: { user: user_response(user), **tokens } }
  else
    render json: { status: false, error: 'Неверный или истекший код' }, status: :unauthorized
  end
end
```

**Добавить route:**
```ruby
post 'auth/verify-2fa', to: 'auth#verify_two_factor'
```

**Frontend: страница ввода кода**
```typescript
// easy-panel/src/pages/TwoFactorVerify.tsx
const TwoFactorVerify = () => {
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/auth/verify-2fa', {
        email: sessionStorage.getItem('2fa_email'),
        code
      });

      if (response.status === true) {
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);
        navigate('/dashboard');
      }
    } catch (error) {
      alert('Неверный код');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Введите код из email</h1>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="123456"
        maxLength={6}
      />
      <button type="submit">Подтвердить</button>
    </form>
  );
};
```

---

## 📋 Checklist для начала работы

### Backend Tasks (выберите с чего начать):
- [ ] Создать `ClientsController` с полным CRUD
- [ ] Создать `AppointmentsController` с CRUD + статусы
- [ ] Создать `TimeSlotsController` с bulk create
- [ ] Добавить пагинацию (gem 'kaminari')
- [ ] Добавить поиск (gem 'ransack')

### Frontend Tasks:
- [ ] Заменить mock clients на API вызовы
- [ ] Заменить mock appointments на API
- [ ] Добавить error handling (react-hot-toast)
- [ ] Добавить loading states
- [ ] Создать компонент Pagination

### Email & 2FA:
- [ ] Зарегистрировать доменную почту
- [ ] Настроить SMTP в Rails
- [ ] Создать email templates
- [ ] Добавить 2FA модель и логику
- [ ] Создать UI для 2FA

---

## 💡 Рекомендации

1. **Начните с Clients** - это самая простая и понятная сущность
2. **Тестируйте через curl/Postman** перед подключением фронтенда
3. **Используйте git branches** для каждой фичи
4. **Коммитьте часто** - автодеплой сразу покажет проблемы
5. **Не удаляйте mock-данные сразу** - держите как fallback на время разработки

---

## 🔗 Быстрые ссылки

- 📊 [Полный TODO.md](./TODO.md) - детальный план на все фазы
- 🚀 [GitHub Actions](https://github.com/RubyBossKirill/easy_panel/actions) - статус деплоя
- 🌐 [Production](https://panel.bulatova-psy.ru) - рабочее приложение
- 🔧 [API](https://api.panel.bulatova-psy.ru/api/v1) - backend endpoint
- 🗄️ [Adminer](https://db.panel.bulatova-psy.ru) - управление БД

---

## ❓ Вопросы?

Если что-то непонятно - открывайте TODO.md, там детальные инструкции по каждому пункту!
