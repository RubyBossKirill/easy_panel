# 🚀 Полная инструкция по развертыванию Easy Panel

> **Единая инструкция от начала до конца**
> Следуйте шагам по порядку - всё будет работать!

## 📋 Что мы делаем

Разворачиваем Easy Panel на сервере **194.87.76.75** по адресам:
- `https://panel.bulatova-psy.ru` - Frontend (интерфейс)
- `https://api.panel.bulatova-psy.ru` - Backend (API)
- `https://db.panel.bulatova-psy.ru` - Adminer (БД)

Easy Panel работает **полностью изолированно** от N8N и других сервисов.

---

## 🧹 Шаг 0: Очистка (если что-то уже делали)

Если вы уже пытались разворачивать Easy Panel, сначала очистим сервер:

```bash
# В Termius подключитесь к серверу
ssh root@194.87.76.75

# Удалите старые контейнеры Easy Panel (если есть)
cd /opt/easy-panel 2>/dev/null && docker compose -f docker-compose.server.yml --env-file .env.easy-panel down || true

# Удалите директорию
rm -rf /opt/easy-panel

# Удалите старые образы (опционально)
docker image prune -af --filter "label=easy_panel"
```

Готово! Теперь начнем с чистого листа.

---

## 🔑 Шаг 1: Генерация ключей безопасности

**На вашем компьютере** (НЕ на сервере) откройте терминал и выполните:

```bash
# Пароль для БД (сохраните результат!)
openssl rand -base64 32

# SECRET_KEY_BASE (сохраните результат!)
openssl rand -hex 64

# Три ключа шифрования (сохраните все три!)
openssl rand -hex 32
openssl rand -hex 32
openssl rand -hex 32
```

**ВАЖНО:** Сохраните все 5 результатов в текстовый файл - они понадобятся дальше!

---

## 🌐 Шаг 2: Настройка DNS

Зайдите в панель управления доменом `bulatova-psy.ru` и добавьте A-записи:

```
panel.bulatova-psy.ru     →  194.87.76.75
api.panel.bulatova-psy.ru →  194.87.76.75
db.panel.bulatova-psy.ru  →  194.87.76.75
```

**Проверка** (на своем компьютере через 5-10 минут):
```bash
nslookup panel.bulatova-psy.ru
```
Должен вернуть: `194.87.76.75`

---

## 🔐 Шаг 3: Настройка GitHub Secrets

1. Откройте: https://github.com/RubyBossKirill/easy_panel/settings/secrets/actions
2. Нажмите `New repository secret` и добавьте 3 секрета:

**SERVER_HOST**
```
194.87.76.75
```

**SERVER_USER**
```
root
```

**SERVER_PASSWORD**
```
x?7mfZNum1UFk.
```

3. Сохраните каждый секрет

---

## 🖥️ Шаг 4: Настройка сервера

### 4.1 Подключитесь к серверу

Откройте Termius и подключитесь к **194.87.76.75**

### 4.2 Создайте директорию и файлы

```bash
# Создайте директорию
mkdir -p /opt/easy-panel
cd /opt/easy-panel

# Скачайте необходимые файлы из репозитория
git clone https://github.com/RubyBossKirill/easy_panel.git temp_repo
cp temp_repo/docker-compose.server.yml .
cp temp_repo/deploy-to-server.sh ./deploy-easy-panel.sh
chmod +x deploy-easy-panel.sh
rm -rf temp_repo
```

### 4.3 Создайте .env файл

```bash
nano .env.easy-panel
```

Вставьте следующее (замените `ВСТАВЬТЕ_XXX` на ключи из **Шага 1**):

```env
DOMAIN_NAME=bulatova-psy.ru

EASY_PANEL_DB_NAME=easy_panel_production
EASY_PANEL_DB_USER=easy_panel_user
EASY_PANEL_DB_PASSWORD=ВСТАВЬТЕ_ПАРОЛЬ_ДЛЯ_БД

SECRET_KEY_BASE=ВСТАВЬТЕ_SECRET_KEY_BASE

ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY=ВСТАВЬТЕ_КЛЮЧ_1
ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY=ВСТАВЬТЕ_КЛЮЧ_2
ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT=ВСТАВЬТЕ_КЛЮЧ_3
```

Сохраните: `Ctrl+X` → `Y` → `Enter`

### 4.4 Проверка файлов

```bash
# Убедитесь, что файлы на месте
ls -la
```

Должны быть:
- `.env.easy-panel`
- `docker-compose.server.yml`
- `deploy-easy-panel.sh`

---

## 🚀 Шаг 5: Первый запуск

```bash
# Экспортируйте переменные
export $(cat .env.easy-panel | xargs)

# Запустите развертывание
./deploy-easy-panel.sh
```

Скрипт автоматически:
- ✅ Скачает Docker образы из GitHub Registry
- ✅ Запустит контейнеры
- ✅ Создаст БД и выполнит миграции
- ✅ Загрузит тестовых пользователей

**Ожидание:** 5-10 минут (образы большие)

---

## ✅ Шаг 6: Проверка работы

### 6.1 Проверьте контейнеры

```bash
docker compose -f docker-compose.server.yml --env-file .env.easy-panel ps
```

Все контейнеры должны быть `Up` и `healthy`.

### 6.2 Откройте в браузере

- `https://panel.bulatova-psy.ru` - страница входа
- `https://api.panel.bulatova-psy.ru/health` - должен вернуть `{"status":"ok"}`
- `https://db.panel.bulatova-psy.ru` - Adminer

### 6.3 Войдите в систему

Используйте тестовые данные:

**Администратор:**
```
Email: admin@test.com
Пароль: password
```

**Менеджер:**
```
Email: manager@test.com
Пароль: password
```

**Сотрудник:**
```
Email: employee@test.com
Пароль: password
```

---

## 🔄 Автоматическое обновление

После настройки GitHub Secrets (Шаг 3), каждый push в `main` ветку автоматически:
- ✅ Соберет новые Docker образы
- ✅ Загрузит их на сервер
- ✅ Обновит приложение
- ✅ Выполнит миграции

**Без простоя!** (Zero-downtime deployment)

---

## 📊 Полезные команды

### Просмотр логов

```bash
cd /opt/easy-panel

# Все логи в реальном времени
docker compose -f docker-compose.server.yml --env-file .env.easy-panel logs -f

# Только backend
docker compose -f docker-compose.server.yml --env-file .env.easy-panel logs -f easy_panel_backend

# Только frontend
docker compose -f docker-compose.server.yml --env-file .env.easy-panel logs -f easy_panel_frontend
```

### Перезапуск сервисов

```bash
# Перезапустить все
docker compose -f docker-compose.server.yml --env-file .env.easy-panel restart

# Перезапустить backend
docker compose -f docker-compose.server.yml --env-file .env.easy-panel restart easy_panel_backend
```

### Остановка и запуск

```bash
# Остановить
docker compose -f docker-compose.server.yml --env-file .env.easy-panel down

# Запустить
docker compose -f docker-compose.server.yml --env-file .env.easy-panel up -d
```

### Миграции и консоль

```bash
# Rails консоль
docker exec -it easy_panel_backend rails console

# Выполнить миграции
docker exec easy_panel_backend rails db:migrate

# Загрузить seed данные
docker exec easy_panel_backend rails db:seed
```

---

## ❓ Проблемы и решения

### ❌ Ошибка "denied" при скачивании образов

**Проблема:** Docker не может скачать образы из GitHub Registry

**Решение 1:** Сделайте образы публичными:
1. Откройте: https://github.com/users/RubyBossKirill/packages/container/easy_panel%2Fbackend/settings
2. Измените visibility на `Public`
3. Повторите для frontend: https://github.com/users/RubyBossKirill/packages/container/easy_panel%2Ffrontend/settings

**Решение 2:** Соберите образы локально на сервере:
```bash
cd /opt/easy-panel
git clone https://github.com/RubyBossKirill/easy_panel.git
cd easy_panel

# Собрать backend
docker build -t ghcr.io/rubybosskirill/easy_panel/backend:latest -f easy-panel-backend/Dockerfile easy-panel-backend/

# Собрать frontend
docker build -t ghcr.io/rubybosskirill/easy_panel/frontend:latest --build-arg REACT_APP_API_URL=https://api.panel.bulatova-psy.ru -f easy-panel/Dockerfile easy-panel/

# Вернуться и запустить
cd /opt/easy-panel
docker compose -f docker-compose.server.yml --env-file .env.easy-panel up -d
```

### ❌ Backend перезагружается (Restarting)

**Проверьте логи:**
```bash
docker logs easy_panel_backend
```

**Частые причины:**
- Неправильный DATABASE_URL (проверьте .env.easy-panel)
- Отсутствуют ключи шифрования
- БД PostgreSQL еще не запустилась (подождите 30 секунд)

### ❌ Ошибка 502 Bad Gateway

Подождите 30-60 секунд - контейнеры запускаются. Проверьте статус:
```bash
docker compose -f docker-compose.server.yml --env-file .env.easy-panel ps
```

### ❌ SSL сертификат не выдается

1. Проверьте DNS (должно пройти 5-30 минут):
```bash
nslookup panel.bulatova-psy.ru
```

2. Проверьте логи Traefik на сервере

3. Подождите 5-10 минут - Traefik автоматически получит сертификаты

---

## 🎉 Готово!

После выполнения всех шагов у вас:
- ✅ Работающее приложение на `https://panel.bulatova-psy.ru`
- ✅ Автоматический деплой при push в GitHub
- ✅ Изолированная инфраструктура
- ✅ Автоматический SSL
- ✅ Защищенное хранение данных

**Если возникли вопросы - обращайтесь!** 🚀

---

## 📝 Что дальше?

1. **Смените тестовые пароли** после первого входа
2. **Настройте резервное копирование БД**
3. **Добавьте реальных пользователей**
4. **Настройте мониторинг** (опционально)

