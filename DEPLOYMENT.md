# 🚀 Easy Panel Deployment Guide

## Архитектура

```
┌─────────────┐
│   GitHub    │
│  Repository │
└──────┬──────┘
       │ Push to main
       ▼
┌──────────────┐
│GitHub Actions│ (CI/CD)
└──────┬───────┘
       │ Deploy
       ▼
┌─────────────────────────────────┐
│        Production Server        │
│  ┌────────────────────────────┐ │
│  │         Nginx              │ │
│  │    (Reverse Proxy)         │ │
│  └─────────┬──────────────────┘ │
│            │                     │
│     ┌──────┴──────┐             │
│     │             │             │
│  ┌──▼───┐    ┌───▼────┐        │
│  │React │    │ Rails  │        │
│  │ App  │    │  API   │        │
│  └──────┘    └───┬────┘        │
│                  │              │
│            ┌─────▼─────┐       │
│            │PostgreSQL │       │
│            │ Database  │       │
│            └───────────┘       │
└─────────────────────────────────┘
```

## Опция 1: Автоматический деплой через GitHub Actions (Рекомендуется)

### Подготовка сервера

1. **Установите Docker на сервере:**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Установите Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

2. **Создайте директорию для приложения:**
```bash
sudo mkdir -p /opt/easy_panel
sudo chown $USER:$USER /opt/easy_panel
cd /opt/easy_panel
```

3. **Создайте .env файл:**
```bash
cp .env.example .env
nano .env
```

Заполните все переменные окружения:
```env
DB_USER=postgres
DB_PASSWORD=$(openssl rand -hex 32)
DB_NAME=easy_panel_production
SECRET_KEY_BASE=$(openssl rand -hex 64)
ENCRYPTION_PRIMARY_KEY=$(openssl rand -base64 32)
ENCRYPTION_DETERMINISTIC_KEY=$(openssl rand -base64 32)
ENCRYPTION_KEY_DERIVATION_SALT=$(openssl rand -base64 32)
API_URL=https://yourdomain.com/api/v1
```

### Настройка GitHub Secrets

Перейдите в Settings → Secrets and variables → Actions и добавьте:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `SERVER_HOST` | IP или домен сервера | `123.456.789.0` |
| `SERVER_USER` | SSH пользователь | `ubuntu` |
| `SERVER_PORT` | SSH порт (опционально) | `22` |
| `SSH_PRIVATE_KEY` | Приватный SSH ключ | `-----BEGIN RSA PRIVATE KEY-----...` |
| `API_URL` | URL вашего API | `https://yourdomain.com/api/v1` |

#### Генерация SSH ключа:
```bash
# На вашем компьютере
ssh-keygen -t rsa -b 4096 -f ~/.ssh/easy_panel_deploy

# Скопируйте публичный ключ на сервер
ssh-copy-id -i ~/.ssh/easy_panel_deploy.pub user@your-server

# Скопируйте ПРИВАТНЫЙ ключ в GitHub Secrets
cat ~/.ssh/easy_panel_deploy
```

### Деплой

После настройки, каждый push в `main` ветку автоматически:
1. ✅ Собирает Docker образы
2. ✅ Загружает их в GitHub Container Registry
3. ✅ Подключается к серверу по SSH
4. ✅ Загружает новые образы
5. ✅ Запускает миграции БД
6. ✅ Перезапускает сервисы с zero downtime

```bash
git add .
git commit -m "Deploy new version"
git push origin main
```

## Опция 2: Ручной деплой

### 1. Клонируйте репозиторий на сервер:
```bash
cd /opt
git clone https://github.com/yourusername/easy_panel.git
cd easy_panel
```

### 2. Настройте окружение:
```bash
cp .env.example .env
nano .env  # Заполните все переменные
```

### 3. Запустите приложение:
```bash
# Соберите образы
docker compose -f docker-compose.prod.yml build

# Запустите БД
docker compose -f docker-compose.prod.yml up -d db

# Подождите пока БД запустится (10-15 сек)
sleep 15

# Запустите миграции
docker compose -f docker-compose.prod.yml run --rm backend rails db:create
docker compose -f docker-compose.prod.yml run --rm backend rails db:migrate
docker compose -f docker-compose.prod.yml run --rm backend rails db:seed

# Запустите все сервисы
docker compose -f docker-compose.prod.yml up -d
```

### 4. Проверьте статус:
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

## Обновление приложения (ручное)

```bash
cd /opt/easy_panel

# Получите последние изменения
git pull origin main

# Пересоберите образы
docker compose -f docker-compose.prod.yml build

# Запустите миграции
docker compose -f docker-compose.prod.yml run --rm backend rails db:migrate

# Перезапустите с zero downtime
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# Очистите старые образы
docker image prune -f
```

## Настройка HTTPS (Let's Encrypt)

### 1. Установите Certbot:
```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

### 2. Получите SSL сертификат:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 3. Обновите nginx конфиг для HTTPS:
```nginx
# В nginx/nginx.conf добавьте:
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Остальная конфигурация...
}
```

## Мониторинг и логи

### Просмотр логов:
```bash
# Все сервисы
docker compose -f docker-compose.prod.yml logs -f

# Только backend
docker compose -f docker-compose.prod.yml logs -f backend

# Только frontend
docker compose -f docker-compose.prod.yml logs -f frontend
```

### Проверка здоровья:
```bash
# Health check
curl http://localhost/health

# API health
curl http://localhost/api/up
```

### Статистика использования:
```bash
docker stats
```

## Backup и восстановление

### Backup базы данных:
```bash
# Создать backup
docker compose -f docker-compose.prod.yml exec db pg_dump -U postgres easy_panel_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Или через docker exec
docker exec easy_panel_db_prod pg_dump -U postgres easy_panel_production > backup.sql
```

### Восстановление:
```bash
# Восстановить из backup
cat backup.sql | docker compose -f docker-compose.prod.yml exec -T db psql -U postgres easy_panel_production
```

### Автоматические backup (cron):
```bash
# Добавьте в crontab
crontab -e

# Backup каждый день в 2:00 AM
0 2 * * * cd /opt/easy_panel && docker compose -f docker-compose.prod.yml exec db pg_dump -U postgres easy_panel_production > /opt/backups/easy_panel_$(date +\%Y\%m\%d).sql

# Удаление старых backup (старше 30 дней)
0 3 * * * find /opt/backups -name "easy_panel_*.sql" -mtime +30 -delete
```

## Масштабирование

### Горизонтальное масштабирование backend:
```bash
# Запустите несколько инстансов backend
docker compose -f docker-compose.prod.yml up -d --scale backend=3
```

### Вертикальное масштабирование:
```yaml
# В docker-compose.prod.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

## Troubleshooting

### Сервис не запускается:
```bash
# Проверьте логи
docker compose -f docker-compose.prod.yml logs backend

# Проверьте переменные окружения
docker compose -f docker-compose.prod.yml config

# Перезапустите сервис
docker compose -f docker-compose.prod.yml restart backend
```

### База данных недоступна:
```bash
# Проверьте статус
docker compose -f docker-compose.prod.yml ps db

# Проверьте логи
docker compose -f docker-compose.prod.yml logs db

# Подключитесь к БД
docker compose -f docker-compose.prod.yml exec db psql -U postgres
```

### Проблемы с миграциями:
```bash
# Откатите последнюю миграцию
docker compose -f docker-compose.prod.yml run --rm backend rails db:rollback

# Проверьте статус миграций
docker compose -f docker-compose.prod.yml run --rm backend rails db:migrate:status
```

## Безопасность

### Важные рекомендации:
- ✅ Используйте сильные пароли для БД
- ✅ Регулярно обновляйте Docker образы
- ✅ Настройте firewall (ufw)
- ✅ Используйте HTTPS
- ✅ Регулярно делайте backup
- ✅ Мониторьте логи на подозрительную активность
- ✅ Ограничьте SSH доступ (ключи, не пароли)

### Настройка firewall:
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## Производительность

### Рекомендуемые ресурсы сервера:

| Пользователей | CPU | RAM | Диск |
|---------------|-----|-----|------|
| < 100 | 2 cores | 4 GB | 50 GB |
| 100-500 | 4 cores | 8 GB | 100 GB |
| 500-1000 | 8 cores | 16 GB | 200 GB |

## Поддержка

Если возникли проблемы:
1. Проверьте логи: `docker compose logs`
2. Проверьте документацию: [SECURITY.md](./SECURITY.md)
3. Создайте issue в GitHub репозитории
