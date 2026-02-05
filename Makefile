.PHONY: help up down restart logs ps build clean migrate seed console routes test

help: ## Показать список доступных команд
	@echo "Easy Panel - Команды для разработки:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

up: ## Запустить все сервисы
	docker compose up -d
	@echo "✅ Проект запущен!"
	@echo "🌐 Frontend: http://localhost:3000"
	@echo "🔧 Backend:  http://localhost:5001/api/v1"
	@echo "🗄️ Database: localhost:5432"

down: ## Остановить все сервисы
	docker compose down

restart: ## Перезапустить все сервисы
	docker compose restart

restart-backend: ## Перезапустить только backend
	docker compose restart backend

restart-frontend: ## Перезапустить только frontend
	docker compose restart frontend

logs: ## Показать логи всех сервисов
	docker compose logs -f

logs-backend: ## Показать логи backend
	docker compose logs -f backend

logs-frontend: ## Показать логи frontend
	docker compose logs -f frontend

logs-db: ## Показать логи базы данных
	docker compose logs -f db

ps: ## Показать статус контейнеров
	docker compose ps

build: ## Пересобрать все образы
	docker compose build

build-backend: ## Пересобрать backend образ
	docker compose build backend

build-frontend: ## Пересобрать frontend образ
	docker compose build frontend

clean: ## Остановить и удалить все (включая volumes)
	docker compose down -v
	@echo "⚠️  БД полностью очищена!"

migrate: ## Применить миграции
	docker compose exec backend rails db:migrate

migrate-status: ## Показать статус миграций
	docker compose exec backend rails db:migrate:status

rollback: ## Откатить последнюю миграцию
	docker compose exec backend rails db:rollback

seed: ## Заполнить БД тестовыми данными
	docker compose exec backend rails db:seed

reset-db: ## Пересоздать БД с нуля
	docker compose exec backend rails db:drop db:create db:migrate db:seed
	@echo "✅ БД пересоздана с seed данными"

console: ## Открыть Rails консоль
	docker compose exec backend rails console

routes: ## Показать список API routes
	docker compose exec backend rails routes

routes-grep: ## Найти route (make routes-grep ROUTE=users)
	docker compose exec backend rails routes | grep $(ROUTE)

test-backend: ## Запустить тесты backend
	docker compose exec backend rspec

test-frontend: ## Запустить тесты frontend
	docker compose exec frontend npm test

shell-backend: ## Зайти в backend контейнер (bash)
	docker compose exec backend bash

shell-frontend: ## Зайти в frontend контейнер (sh)
	docker compose exec frontend sh

shell-db: ## Подключиться к PostgreSQL (psql)
	docker compose exec db psql -U postgres -d easy_panel_development

login: ## Получить access token (для тестирования API)
	@echo "Логин как owner@company.com..."
	@curl -s -X POST http://localhost:5001/api/v1/auth/login \
		-H "Content-Type: application/json" \
		-d '{"email":"owner@company.com","password":"12345678"}' | python3 -m json.tool

users: ## Получить список пользователей (нужен TOKEN)
	@echo "Получение списка пользователей..."
	@echo "Сначала выполните: make login"
	@echo "Затем скопируйте access_token и выполните:"
	@echo 'curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5001/api/v1/users | python3 -m json.tool'

health: ## Проверить health endpoints
	@echo "Checking health..."
	@echo "Backend: "
	@curl -s http://localhost:5001/health && echo ""
	@echo "Frontend: "
	@curl -s http://localhost:3000/health && echo "" || echo "Frontend health check not available"

stats: ## Показать использование ресурсов контейнерами
	docker stats --no-stream

prune: ## Очистить неиспользуемые Docker ресурсы
	docker system prune -f
	@echo "✅ Неиспользуемые ресурсы удалены"
