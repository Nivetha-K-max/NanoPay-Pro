#!/bin/bash

# NanoPay Pro Development Quick Start Script
# Run from project root: ./quick-start.sh

set -e

echo "==================================="
echo "NanoPay Pro — Quick Start"
echo "==================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v java &> /dev/null; then
    echo "❌ Java 17 not found. Please install Java 17+"
    exit 1
fi

if ! command -v mvn &> /dev/null; then
    echo "❌ Maven not found. Please install Maven 3.8+"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker"
    exit 1
fi

echo "✅ Prerequisites OK"
echo ""

# Build backend
echo "Building backend modules..."
cd backend
mvn clean install -DskipTests -q
cd ..
echo "✅ Backend built"
echo ""

# Start infrastructure
echo "Starting infrastructure (Docker Compose)..."
cd infra
if docker compose --env-file ../.env.dev ps | grep -q "nanopay"; then
    echo "ℹ️  Infrastructure already running"
else
    docker compose --env-file ../.env.dev up -d
    echo "⏳ Waiting for services to be healthy..."
    sleep 10
fi
cd ..
echo "✅ Infrastructure ready"
echo ""

# Print next steps
echo "==================================="
echo "✅ Setup Complete!"
echo "==================================="
echo ""
echo "Services running:"
echo "  Backend API: http://localhost:8080"
echo "  Swagger UI: http://localhost:8080/swagger-ui.html"
echo "  Kibana: http://localhost:5601"
echo "  Grafana: http://localhost:3001 (admin/admin)"
echo "  Prometheus: http://localhost:9090"
echo ""
echo "Next steps:"
echo "  1. In terminal 1: cd backend/nanopay-api && mvn spring-boot:run"
echo "  2. In terminal 2: cd frontend && npm install && npm start"
echo ""
echo "Happy coding! 🚀"
