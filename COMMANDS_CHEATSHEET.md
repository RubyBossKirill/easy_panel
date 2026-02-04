# 🚀 Easy Panel - Шпаргалка по командам

## 📦 Первоначальная настройка

### 1. Создать GitHub репозиторий и отправить код
```bash
cd /Users/a1234/easy_panel

# Инициализация (уже сделано)
git init
git add .
git commit -m "Initial commit: Full-stack app with CI/CD"

# Подключить remote и отправить
git remote add origin https://github.com/yourusername/easy_panel.git
git branch -M main
git push -u origin main
```

### 2. Сгенерировать SSH ключ для деплоя
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/easy_panel_deploy -N ""
ssh-copy-id -i ~/.ssh/easy_panel_deploy.pub user@your-server
cat ~/.ssh/easy_panel_deploy  # Скопировать в GitHub Secrets
```

### 3. Подготовить сервер
```bash
# На сервере
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
sudo mkdir -p /opt/easy_panel
sudo chown $USER:$USER /opt/easy_panel
cd /opt/easy_panel
nano .env  # Создать и заполнить
```

## 🔧 Development (локально)

### Запуск
```bash
cd /Users/a1234/easy_panel
docker compose up -d              # Запустить всё
docker compose ps                 # Проверить статус
docker compose logs -f            # Смотреть логи
```

### Остановка
```bash
docker compose down               # Остановить
docker compose down -v            # Остановить + удалить volumes (БД)
```

### Перезапуск отдельных сервисов
```bash
docker compose restart backend
docker compose restart frontend
docker compose restart db
```

### Логи
```bash
docker compose logs -f                    # Все
docker compose logs -f backend            # Только backend
docker compose logs -f frontend           # Только frontend
docker compose logs --tail=100 backend    # Последние 100 строк
```

### Выполнение команд в контейнерах
```bash
# Rails консоль
docker compose exec backend rails console

# Миграции
docker compose exec backend rails db:migrate
docker compose exec backend rails db:rollback
docker compose exec backend rails db:seed

# Bash в контейнере
docker compose exec backend bash

# PostgreSQL
docker compose exec db psql -U postgres easy_panel_development
```

## 🚀 Production (на сервере)

### Первый деплой
```bash
# Просто push - GitHub Actions сделает всё
git push origin main
```

### Ручной деплой (если нужно)
```bash
# На сервере
cd /opt/easy_panel
git pull origin main
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml run --rm backend rails db:migrate
docker compose -f docker-compose.prod.yml up -d
```

### Управление сервисами
```bash
cd /opt/easy_panel

# Статус
docker compose -f docker-compose.prod.yml ps

# Логи
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml logs -f backend

# Перезапуск
docker compose -f docker-compose.prod.yml restart
docker compose -f docker-compose.prod.yml restart backend

# Остановка
docker compose -f docker-compose.prod.yml down

# Запуск
docker compose -f docker-compose.prod.yml up -d
```

### Обновление
```bash
cd /opt/easy_panel
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml run --rm backend rails db:migrate
docker compose -f docker-compose.prod.yml up -d
docker image prune -f  # Очистить старые образы
```

### Масштабирование
```bash
# Запустить 3 инстанса backend
docker compose -f docker-compose.prod.yml up -d --scale backend=3
```

## 💾 Backup & Restore

### Backup БД
```bash
# Вручную
docker compose exec db pg_dump -U postgres easy_panel_production > backup_$(date +%Y%m%d).sql

# Production
docker compose -f docker-compose.prod.yml exec db pg_dump -U postgres easy_panel_production > backup.sql
```

### Restore БД
```bash
cat backup.sql | docker compose exec -T db psql -U postgres easy_panel_production
```

### Автоматический backup (cron)
```bash
crontab -e

# Добавить:
0 2 * * * cd /opt/easy_panel && docker compose -f docker-compose.prod.yml exec db pg_dump -U postgres easy_panel_production > /opt/backups/backup_$(date +\%Y\%m\%d).sql
0 3 * * * find /opt/backups -name "backup_*.sql" -mtime +30 -delete
```

## 🔍 Debugging & Troubleshooting

### Проверка здоровья
```bash
curl http://localhost/health
curl http://localhost/api/up
docker compose ps  # Проверить что всё running
```

### Проверка логов на ошибки
```bash
docker compose logs backend | grep ERROR
docker compose logs backend | grep -i "error\|exception\|fail"
```

### Подключение к БД
```bash
# Development
docker compose exec db psql -U postgres easy_panel_development

# Production
docker compose -f docker-compose.prod.yml exec db psql -U postgres easy_panel_production

# Полезные SQL команды
\dt                    # Список таблиц
\d users              # Структура таблицы users
SELECT * FROM users;  # Все пользователи
```

### Проверка refresh tokens в БД
```bash
docker compose exec backend rails runner "
rt = RefreshToken.last
puts 'Token (decrypted): ' + rt.token[0..50]
puts 'IP (decrypted): ' + rt.ip_address
puts 'Raw DB (encrypted): ' + RefreshToken.connection.select_value('SELECT token FROM refresh_tokens WHERE id = ' + rt.id.to_s)[0..80]
"
```

### Rails консоль
```bash
docker compose exec backend rails console

# Внутри консоли:
User.count
User.first
RefreshToken.active.count
```

## 📊 Мониторинг

### Статистика Docker
```bash
docker stats                           # Реалтайм статистика
docker system df                       # Использование диска
docker system prune -a                 # Очистка (осторожно!)
```

### Размер логов
```bash
docker compose logs --no-color | wc -l
docker system df -v | grep log
```

### Top процессы в контейнере
```bash
docker compose exec backend top
docker compose exec backend ps aux
```

## 🔄 Git & Deploy

### Workflow для изменений
```bash
# 1. Внесите изменения
git status
git diff

# 2. Закоммитьте
git add .
git commit -m "Your message"

# 3. Отправьте (автодеплой!)
git push origin main

# 4. Проверьте GitHub Actions
# https://github.com/yourusername/easy_panel/actions
```

### Создание feature branch
```bash
git checkout -b feature/new-feature
# ... сделайте изменения ...
git add .
git commit -m "Add new feature"
git push origin feature/new-feature
# Создайте Pull Request на GitHub
```

### Откат к предыдущей версии
```bash
git log --oneline                    # Найдите commit hash
git revert <commit-hash>             # Создать revert commit
git push origin main                 # Задеплоить откат
```

## 🛠️ Maintenance

### Очистка Docker
```bash
# Остановить всё
docker compose down

# Удалить неиспользуемые образы
docker image prune -a

# Удалить неиспользуемые volumes
docker volume prune

# Полная очистка (осторожно!)
docker system prune -a --volumes
```

### Обновление зависимостей

#### Frontend
```bash
cd easy-panel
npm update
npm audit fix
git add package*.json
git commit -m "Update frontend dependencies"
```

#### Backend
```bash
cd easy-panel-backend
bundle update
git add Gemfile.lock
git commit -m "Update backend dependencies"
```

### Просмотр переменных окружения
```bash
docker compose config               # Development
docker compose -f docker-compose.prod.yml config  # Production
```

## 🔐 Security

### Проверка залогиненных пользователей
```bash
docker compose exec backend rails runner "
puts 'Active refresh tokens: ' + RefreshToken.active.count.to_s
puts 'Revoked tokens: ' + RefreshToken.revoked.count.to_s
puts 'Expired tokens: ' + RefreshToken.expired.count.to_s
"
```

### Отозвать все токены пользователя
```bash
docker compose exec backend rails runner "
user = User.find_by(email: 'user@example.com')
user.refresh_tokens.active.each(&:revoke!)
puts 'All tokens revoked for ' + user.email
"
```

### Сменить encryption keys (осторожно!)
```bash
# 1. Сгенерируйте новые
docker compose exec backend rails db:encryption:init

# 2. Обновите .env
# 3. Re-encrypt данные (сложный процесс!)
```

## 📱 Quick Access

### Полезные URL
```bash
# Development
http://localhost:3000              # Frontend
http://localhost:5001/api/v1      # Backend API
http://localhost:5432              # PostgreSQL

# Production
https://yourdomain.com             # Frontend
https://yourdomain.com/api/v1     # Backend API
https://yourdomain.com/health     # Health check
```

### API Testing
```bash
# Login
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"owner@company.com","password":"12345678"}'

# Get current user
curl -X GET http://localhost:5001/api/v1/auth/me \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

## 🎯 Shortcuts

```bash
# Алиасы для .bashrc или .zshrc
alias ep-dev='cd /Users/a1234/easy_panel && docker compose up -d'
alias ep-down='cd /Users/a1234/easy_panel && docker compose down'
alias ep-logs='cd /Users/a1234/easy_panel && docker compose logs -f'
alias ep-restart='cd /Users/a1234/easy_panel && docker compose restart'
alias ep-rails='docker compose exec backend rails console'
alias ep-psql='docker compose exec db psql -U postgres easy_panel_development'
```

---

**Быстрый доступ:**
- Документация: [README.md](./README.md)
- Деплой: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Безопасность: [SECURITY.md](./SECURITY.md)
- Настройка: [SETUP_SUMMARY.md](./SETUP_SUMMARY.md)
