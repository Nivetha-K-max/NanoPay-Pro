.PHONY: help build run test clean docker-up docker-down logs

help:
	@echo "NanoPay Pro — Development Commands"
	@echo ""
	@echo "Build:"
	@echo "  make build          Build all backend modules"
	@echo "  make build-api      Build API module only"
	@echo ""
	@echo "Run:"
	@echo "  make run            Start backend API (requires mvn, runs on port 8080)"
	@echo "  make run-frontend   Start React frontend (requires npm, runs on port 3000)"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up      Start all infrastructure (MySQL, Redis, Kafka, ELK, etc.)"
	@echo "  make docker-down    Stop all infrastructure"
	@echo "  make docker-clean   Stop and remove all containers/volumes"
	@echo "  make logs           Tail Docker logs"
	@echo ""
	@echo "Testing:"
	@echo "  make test           Run all tests"
	@echo "  make test-core      Run core domain tests only"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean          Clean all build artifacts"
	@echo "  make status         Show infrastructure status"

# Build targets
build:
	cd backend && mvn clean install -DskipTests

build-api:
	cd backend && mvn clean package -pl nanopay-api -DskipTests

build-test:
	cd backend && mvn clean verify

# Run targets
run:
	cd backend/nanopay-api && mvn spring-boot:run

run-frontend:
	cd frontend && npm install && npm start

# Docker targets
docker-up:
	cd infra && docker compose --env-file ../.env.dev up -d
	@echo "Infrastructure starting... Check status with: make status"

docker-down:
	cd infra && docker compose --env-file ../.env.dev down

docker-clean:
	cd infra && docker compose --env-file ../.env.dev down -v
	@echo "All containers stopped and volumes removed."

docker-logs:
	cd infra && docker compose --env-file ../.env.dev logs -f

status:
	cd infra && docker compose --env-file ../.env.dev ps

# Testing
test:
	cd backend && mvn clean verify

test-core:
	cd backend && mvn clean verify -pl nanopay-core

test-watch:
	cd backend && mvn clean test -DreuseForks=false

# Cleanup
clean:
	cd backend && mvn clean
	rm -rf frontend/build frontend/dist node_modules
	@echo "Build artifacts cleaned."

# Development environment setup
setup:
	@echo "Setting up development environment..."
	@echo "1. Building backend..."
	$(MAKE) build
	@echo "2. Starting infrastructure..."
	$(MAKE) docker-up
	@echo ""
	@echo "Development environment ready!"
	@echo "- Backend API: http://localhost:8080"
	@echo "- Swagger UI: http://localhost:8080/swagger-ui.html"
	@echo "- Kibana: http://localhost:5601"
	@echo "- Grafana: http://localhost:3001 (admin/admin)"
	@echo "- Prometheus: http://localhost:9090"
	@echo ""
	@echo "Next: run 'make run' in separate terminal to start API"
	@echo "Then: run 'make run-frontend' in another terminal to start React"
