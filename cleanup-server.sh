#!/bin/bash

# ============================================
# Скрипт очистки Easy Panel с сервера
# ============================================

set -e

echo "🧹 Очистка Easy Panel с сервера..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

error() {
    echo -e "${RED}✗ $1${NC}"
}

echo "📍 Переход в директорию..."
cd /opt/easy-panel 2>/dev/null || { warning "Директория /opt/easy-panel не найдена"; exit 0; }
success "Директория найдена"

echo "🛑 Остановка контейнеров..."
docker compose -f docker-compose.server.yml --env-file .env.easy-panel down 2>/dev/null || warning "Контейнеры не найдены или уже остановлены"
success "Контейнеры остановлены"

echo "🗑️ Удаление volumes (данные БД будут удалены!)..."
docker volume rm easy-panel_easy_panel_postgres_data 2>/dev/null || warning "Volume не найден"
success "Volumes удалены"

echo "📁 Удаление директории..."
cd /
rm -rf /opt/easy-panel
success "Директория удалена"

echo "🖼️ Удаление Docker образов Easy Panel..."
docker images | grep "easy_panel" | awk '{print $3}' | xargs docker rmi -f 2>/dev/null || warning "Образы не найдены"
success "Образы удалены"

echo ""
echo "============================================"
echo -e "${GREEN}✓ Очистка завершена!${NC}"
echo "============================================"
echo ""
echo "Теперь можете следовать инструкции DEPLOYMENT_GUIDE.md"
echo ""
