# ============================================================================
# YaaImg Makefile
# ============================================================================

.DEFAULT_GOAL := help

.PHONY: help build up down logs restart shell health clean \
        dev dev-backend dev-frontend lint test \
        db-push db-reset db-link db-studio

# ────────────────────────────────────────────────────────────────────────────
# Help
# ────────────────────────────────────────────────────────────────────────────

## Show this help message
help:
	@echo "========================================================================"
	@echo "  YaaImg Project - Makefile Commands"
	@echo "========================================================================"
	@echo "  Docker Commands:"
	@echo "    make build        - Build Docker images"
	@echo "    make up           - Build and start all containers in background"
	@echo "    make down         - Stop and remove containers"
	@echo "    make logs         - Tail real-time container logs"
	@echo "    make restart      - Restart containers"
	@echo "    make shell        - Open a shell inside the backend API container"
	@echo "    make health       - Check backend API and container health"
	@echo "    make clean        - Stop containers and remove images/volumes"
	@echo ""
	@echo "  Local Development:"
	@echo "    make dev          - Show instructions for local dev"
	@echo "    make dev-backend  - Run ASP.NET Core backend locally (:5000)"
	@echo "    make dev-frontend - Run Next.js frontend locally (:3000)"
	@echo ""
	@echo "  Quality & Testing:"
	@echo "    make lint         - Run linters for backend and frontend"
	@echo "    make test         - Run backend unit/integration tests"
	@echo ""
	@echo "  Database (Supabase):"
	@echo "    make db-link      - Link project to Supabase Cloud"
	@echo "    make db-push      - Push all migrations to Supabase Cloud"
	@echo "    make db-reset     - Reset and re-apply local database migrations"
	@echo "    make db-studio    - Show Supabase Dashboard URL"
	@echo "========================================================================"

# ────────────────────────────────────────────────────────────────────────────
# Docker Commands
# ────────────────────────────────────────────────────────────────────────────

## Build Docker images
build:
	docker compose build

## Build and run containers
up:
	docker compose up --build -d

## Stop and remove containers
down:
	docker compose down

## Tail container logs
logs:
	docker compose logs -f

## Restart containers
restart:
	docker compose restart

## Shell into the API container
shell:
	docker exec -it yaaimg-api sh

## Check container health
health:
	@echo "=== API Health ==="
	@curl -s http://localhost:5000/health || echo "API is not responding on port 5000"
	@echo ""
	@echo "=== Container Status ==="
	@docker compose ps

## Remove containers and images
clean:
	docker compose down --rmi all --volumes --remove-orphans

# ────────────────────────────────────────────────────────────────────────────
# Local Development (without Docker)
# ────────────────────────────────────────────────────────────────────────────

## Show local dev instructions
dev:
	@echo "============================================"
	@echo "  YaaImg Local Development"
	@echo "============================================"
	@echo ""
	@echo "  Terminal 1 — Backend:"
	@echo "    cd apps/api/src/YaaImg.Api"
	@echo "    dotnet run"
	@echo "    -> http://localhost:5000/swagger"
	@echo "    -> http://localhost:5000/health"
	@echo ""
	@echo "  Terminal 2 — Frontend:"
	@echo "    cd apps/web"
	@echo "    npm run dev"
	@echo "    -> http://localhost:3000"
	@echo ""
	@echo "  Database Dashboard:"
	@echo "    -> https://supabase.com/dashboard/project/ftsefelopcyvncxdeilf"
	@echo "============================================"

## Run backend locally
dev-backend:
	cd apps/api/src/YaaImg.Api && dotnet run

## Run frontend locally
dev-frontend:
	cd apps/web && npm run dev

# ────────────────────────────────────────────────────────────────────────────
# Code Quality
# ────────────────────────────────────────────────────────────────────────────

## Lint backend + frontend
lint:
	@echo "=== Linting Backend ==="
	cd apps/api/src && dotnet build --no-restore -warnaserror
	@echo ""
	@echo "=== Linting Frontend ==="
	cd apps/web && npx next lint

## Run backend tests
test:
	cd apps/api/src && dotnet test

# ────────────────────────────────────────────────────────────────────────────
# Supabase Cloud Database
# ────────────────────────────────────────────────────────────────────────────

## Link to Supabase Cloud project
db-link:
	npx supabase link --project-ref ftsefelopcyvncxdeilf

## Push migrations to Supabase Cloud
db-push:
	npx supabase db push

## Reset local Supabase database
db-reset:
	npx supabase db reset

## Open Supabase Studio (cloud)
db-studio:
	@echo "Opening Supabase Dashboard..."
	@echo "-> https://supabase.com/dashboard/project/ftsefelopcyvncxdeilf"
