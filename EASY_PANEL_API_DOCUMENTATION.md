# Easy Panel API Документация

## Обзор

Данный документ описывает API события для Easy Panel - системы управления записями к сотрудникам. Все события отправляются через webhook на сервер для синхронизации данных между фронтендом и базой данных.

**Webhook URL:** `https://api.easypanel.com/webhook/events`

## 🔐 Безопасность и шифрование

### Обязательные требования безопасности

#### 1. HTTPS соединение
Все запросы должны выполняться только через HTTPS:
```javascript
const API_URL = 'https://api.easypanel.com/webhook/events';
```

#### 2. Шифрование паролей на клиенте
Пароли НЕ должны передаваться в открытом виде. Используйте bcrypt или подобные алгоритмы:

```javascript
import bcrypt from 'bcryptjs';

// На клиенте перед отправкой
const hashedPassword = await bcrypt.hash(password, 10);

// Отправляем хеш, а не пароль
{
  "event": "auth_login",
  "data": {
    "email": "owner@company.com",
    "passwordHash": hashedPassword
  }
}
```

#### 3. Подпись запросов
Для критически важных операций используйте HMAC подписи:

```javascript
import crypto from 'crypto';

const API_SECRET = process.env.API_SECRET;
const timestamp = Date.now();
const dataString = JSON.stringify(requestData);

const signature = crypto
  .createHmac('sha256', API_SECRET)
  .update(dataString + timestamp)
  .digest('hex');

const secureRequest = {
  ...requestData,
  timestamp,
  signature
};
```

#### 4. Защита от CSRF
Используйте CSRF токены для всех изменяющих операций:

```javascript
// Получаем CSRF токен при загрузке приложения
const csrfToken = await fetch('/api/csrf-token').then(r => r.json());

// Добавляем в каждый запрос
{
  "event": "auth_login",
  "data": { email, passwordHash },
  "csrfToken": csrfToken
}
```

### Рекомендуемые дополнительные меры

#### 1. Двухфакторная аутентификация (2FA)
```javascript
{
  "event": "auth_login",
  "data": {
    "email": "owner@company.com",
    "passwordHash": "hashedPassword",
    "totp": "123456" // Google Authenticator код
  }
}
```

#### 2. Rate Limiting на клиенте
```javascript
class RateLimiter {
  constructor(maxRequests = 5, timeWindow = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }

  canMakeRequest() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }
}
```

#### 3. Шифрование чувствительных данных
```javascript
import CryptoJS from 'crypto-js';

// Шифрование данных клиентов
const encryptData = (data, key) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
};

// Расшифровка
const decryptData = (encryptedData, key) => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, key);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};
```

## События авторизации и регистрации

### 🔐 auth_login - Вход в систему

Аутентификация пользователя по email и хешированному паролю.

**Запрос (безопасный):**
```json
{
  "event": "auth_login",
  "data": {
    "email": "owner@company.com",
    "passwordHash": "bcrypt_hashed_password",
    "totp": "123456",
    "deviceId": "device_fingerprint"
  },
  "timestamp": 1690896000000,
  "signature": "hmac_signature_here",
  "csrfToken": "csrf_token_here"
}
```

**Успешный ответ:**
```json
{
  "status": true,
  "data": {
    "user": {
      "id": 1,
      "name": "Иван Иванов",
      "email": "owner@company.com",
      "roleId": "owner",
      "role": {
        "id": "owner",
        "name": "Владелец",
        "permissions": [
          "view_dashboard",
          "manage_schedule",
          "view_clients",
          "manage_clients",
          "view_payments",
          "manage_payments",
          "view_all_clients",
          "manage_all_clients",
          "view_all_payments",
          "manage_all_payments",
          "manage_users",
          "manage_roles",
          "manage_account_settings",
          "manage_payment_settings"
        ]
      },
      "lastLogin": "2025-08-01T13:30:00Z",
      "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "refresh_token_here",
      "expiresAt": "2025-08-02T13:30:00Z"
    }
  }
}
```

**Ошибка аутентификации:**
```json
{
  "status": false,
  "error": "Неверный email или пароль",
  "code": "AUTH_INVALID_CREDENTIALS",
  "remainingAttempts": 4
}
```

### 📝 auth_register - Регистрация нового пользователя

Создание нового аккаунта в системе.

**Запрос (безопасный):**
```json
{
  "event": "auth_register",
  "data": {
    "name": "Анна Петрова",
    "email": "anna@company.com",
    "passwordHash": "bcrypt_hashed_password",
    "inviteCode": "INVITE_12345"
  },
  "timestamp": 1690896000000,
  "signature": "hmac_signature_here",
  "csrfToken": "csrf_token_here"
}
```

**Успешный ответ:**
```json
{
  "status": true,
  "data": {
    "user": {
      "id": 4,
      "name": "Анна Петрова",
      "email": "anna@company.com",
      "roleId": "employee",
      "role": {
        "id": "employee",
        "name": "Сотрудник",
        "permissions": [
          "view_dashboard",
          "manage_schedule",
          "view_clients",
          "manage_clients"
        ]
      },
      "createdAt": "2025-08-01T13:30:00Z",
      "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "refresh_token_here",
      "expiresAt": "2025-08-02T13:30:00Z"
    }
  }
}
```

**Ошибка регистрации:**
```json
{
  "status": false,
  "error": "Пользователь с таким email уже существует",
  "code": "AUTH_USER_EXISTS"
}
```

### 🚪 auth_logout - Выход из системы

Завершение сессии пользователя.

**Запрос:**
```json
{
  "event": "auth_logout",
  "data": {
    "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here"
  },
  "timestamp": 1690896000000,
  "signature": "hmac_signature_here",
  "csrfToken": "csrf_token_here"
}
```

**Ответ:**
```json
{
  "status": true,
  "message": "Сессия успешно завершена"
}
```

### 🔍 auth_validate_session - Проверка валидности сессии

Проверка активности текущей сессии пользователя.

**Запрос:**
```json
{
  "event": "auth_validate_session",
  "data": {
    "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": 1690896000000,
  "signature": "hmac_signature_here"
}
```

**Валидная сессия:**
```json
{
  "status": true,
  "data": {
    "user": {
      "id": 1,
      "name": "Иван Иванов",
      "email": "owner@company.com",
      "roleId": "owner",
      "role": {
        "id": "owner",
        "name": "Владелец",
        "permissions": [...]
      },
      "lastActivity": "2025-08-01T13:30:00Z"
    }
  }
}
```

**Невалидная сессия:**
```json
{
  "status": false,
  "error": "Сессия истекла или недействительна",
  "code": "AUTH_SESSION_INVALID"
}
```

### 🔄 auth_refresh_token - Обновление токена

Обновление JWT токена для продления сессии.

**Запрос:**
```json
{
  "event": "auth_refresh_token",
  "data": {
    "refreshToken": "refresh_token_here"
  },
  "timestamp": 1690896000000,
  "signature": "hmac_signature_here"
}
```

**Ответ:**
```json
{
  "status": true,
  "data": {
    "newSessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "newRefreshToken": "new_refresh_token_here",
    "expiresAt": "2025-08-02T13:30:00Z"
  }
}
```

## Коды ошибок авторизации

| Код | Описание |
|-----|----------|
| `AUTH_INVALID_CREDENTIALS` | Неверный email или пароль |
| `AUTH_USER_EXISTS` | Пользователь с таким email уже существует |
| `AUTH_USER_NOT_FOUND` | Пользователь не найден |
| `AUTH_SESSION_INVALID` | Сессия истекла или недействительна |
| `AUTH_SESSION_EXPIRED` | Сессия истекла |
| `AUTH_INSUFFICIENT_PERMISSIONS` | Недостаточно прав для выполнения операции |
| `AUTH_ACCOUNT_DISABLED` | Аккаунт заблокирован |
| `AUTH_TOO_MANY_ATTEMPTS` | Слишком много попыток входа |
| `AUTH_INVALID_TOTP` | Неверный код двухфакторной аутентификации |
| `AUTH_INVALID_SIGNATURE` | Неверная подпись запроса |
| `AUTH_INVALID_CSRF` | Неверный CSRF токен |
| `AUTH_INVALID_INVITE_CODE` | Неверный код приглашения |

## Безопасность

### Пароли
- **Хеширование на клиенте**: bcrypt с солью (10 раундов)
- **Минимальная длина**: 8 символов
- **Рекомендуется**: буквы, цифры, специальные символы
- **Дополнительно**: проверка на утечки в базе данных

### Токены
- **Формат**: JWT (JSON Web Token)
- **Алгоритм**: HS256 с секретным ключом
- **Время жизни**: 24 часа для session token, 30 дней для refresh token
- **Автоматическое обновление**: каждые 12 часов
- **Хранение**: httpOnly cookies для refresh token, localStorage для session token

### Rate Limiting
- **Попытки входа**: максимум 5 в минуту
- **Регистрация**: максимум 3 в час
- **API запросы**: максимум 100 в минуту
- **Блокировка IP**: при 10 неудачных попытках на 1 час

### Дополнительные меры
- **2FA**: Google Authenticator / SMS
- **Device fingerprinting**: отслеживание устройств
- **IP whitelist**: ограничение доступа по IP
- **Audit logs**: логирование всех действий
- **Session management**: возможность отозвать все сессии

## Логирование

Все события авторизации логируются с маскированием чувствительных данных:

```javascript
// Успешный вход (пароль не логируется)
logger.logAuth('login', 'success', { 
  userId: 1, 
  email: 'owner@company.com', 
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  deviceId: 'device_fingerprint'
});

// Неудачная попытка
logger.logAuth('login', 'failed', { 
  email: 'wrong@email.com', 
  ip: '192.168.1.1', 
  reason: 'invalid_credentials',
  remainingAttempts: 4
});
```

## Примеры использования

### Безопасный вход в систему
```javascript
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const loginUser = async (email, password) => {
  // 1. Хешируем пароль на клиенте
  const passwordHash = await bcrypt.hash(password, 10);
  
  // 2. Создаем подпись запроса
  const timestamp = Date.now();
  const data = { email, passwordHash };
  const signature = crypto
    .createHmac('sha256', API_SECRET)
    .update(JSON.stringify(data) + timestamp)
    .digest('hex');
  
  // 3. Отправляем безопасный запрос
  const loginData = {
    event: 'auth_login',
    data,
    timestamp,
    signature,
    csrfToken: getCsrfToken()
  };

  const response = await fetch('/webhook/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loginData)
  });

  if (response.status) {
    // 4. Сохраняем токены безопасно
    localStorage.setItem('sessionToken', response.data.user.sessionToken);
    document.cookie = `refreshToken=${response.data.user.refreshToken}; httpOnly; secure; samesite=strict`;
    
    // 5. Настраиваем автоматическое обновление токена
    setupTokenRefresh(response.data.user.expiresAt);
  }
};
```

### Проверка сессии с автоматическим обновлением
```javascript
const validateSession = async () => {
  const sessionToken = localStorage.getItem('sessionToken');
  if (!sessionToken) return false;
  
  const validateData = {
    event: 'auth_validate_session',
    data: { sessionToken },
    timestamp: Date.now(),
    signature: createSignature(validateData)
  };
  
  const response = await fetch('/webhook/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validateData)
  });
  
  if (!response.status) {
    // Пытаемся обновить токен
    const refreshed = await refreshToken();
    if (!refreshed) {
      clearAuthData();
      return false;
    }
  }
  
  return true;
};
```

---

*Документация будет дополняться по мере разработки других разделов системы.* 