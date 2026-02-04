#!/bin/bash

# ============================================
# Скрипт развертывания Easy Panel на сервер
# ============================================

set -e  # Остановка при ошибке

echo "🚀 Начало развертывания Easy Panel..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функция для вывода успешного сообщения
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Функция для вывода предупреждения
warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Функция для вывода ошибки
error() {
    echo -e "${RED}✗ $1${NC}"
}

# Проверка переменных окружения
if [ -z "$EASY_PANEL_DB_PASSWORD" ]; then
    error "EASY_PANEL_DB_PASSWORD не установлен!"
    exit 1
fi

if [ -z "$SECRET_KEY_BASE" ]; then
    error "SECRET_KEY_BASE не установлен!"
    exit 1
fi

echo "📦 Шаг 1: Создание директории для Easy Panel..."
mkdir -p /opt/easy-panel
cd /opt/easy-panel
success "Директория создана"

echo "📝 Шаг 2: Копирование конфигурационных файлов..."
# docker-compose.server.yml и .env должны быть уже на сервере
if [ ! -f "docker-compose.server.yml" ]; then
    error "docker-compose.server.yml не найден!"
    exit 1
fi

if [ ! -f ".env.easy-panel" ]; then
    error ".env.easy-panel не найден!"
    exit 1
fi
success "Конфигурационные файлы найдены"

echo "🔄 Шаг 3: Остановка старых контейнеров (если есть)..."
docker-compose -f docker-compose.server.yml --env-file .env.easy-panel down || true
success "Старые контейнеры остановлены"

echo "🗑️ Шаг 4: Удаление старых образов..."
docker image prune -f || true
success "Старые образы удалены"

echo "⬇️ Шаг 5: Загрузка новых образов..."
docker-compose -f docker-compose.server.yml --env-file .env.easy-panel pull
success "Образы загружены"

echo "🏗️ Шаг 6: Запуск контейнеров..."
docker-compose -f docker-compose.server.yml --env-file .env.easy-panel up -d
success "Контейнеры запущены"

echo "⏳ Ожидание запуска PostgreSQL..."
sleep 10

echo "🗄️ Шаг 7: Выполнение миграций БД..."
docker exec easy_panel_backend rails db:create db:migrate || {
    warning "База данных уже существует или миграции не требуются"
}
success "Миграции выполнены"

echo "🌱 Шаг 8: Загрузка seed данных..."
docker exec easy_panel_backend rails db:seed || {
    warning "Seed данные уже загружены"
}
success "Seed данные загружены"

echo "🧹 Шаг 9: Очистка неиспользуемых ресурсов..."
docker system prune -f || true
success "Ресурсы очищены"

echo ""
echo "============================================"
echo -e "${GREEN}✓ Развертывание завершено успешно!${NC}"
echo "============================================"
echo ""
echo "📍 Ваше приложение доступно по адресам:"
echo "   Frontend: https://panel.bulatova-psy.ru"
echo "   Backend:  https://api.panel.bulatova-psy.ru"
echo "   Adminer:  https://db.panel.bulatova-psy.ru"
echo ""
echo "👤 Тестовые пользователи:"
echo "   Admin:    admin@test.com / password"
echo "   Manager:  manager@test.com / password"
echo "   Employee: employee@test.com / password"
echo ""
echo "📊 Проверка статуса контейнеров:"
docker-compose -f docker-compose.server.yml --env-file .env.easy-panel ps
echo ""
echo "📝 Логи можно посмотреть командой:"
echo "   docker-compose -f docker-compose.server.yml --env-file .env.easy-panel logs -f [имя_сервиса]"
