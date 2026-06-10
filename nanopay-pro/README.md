# NanoPay Pro — Phase 1 Setup Complete

This is the complete Phase 1 project setup for **NanoPay Pro**, a production-grade payment platform.

## Quick Start

### Prerequisites
- Java 17+
- Maven 3.8+
- Docker & Docker Compose
- Node.js 18+ (for frontend)

### 1. Backend Build

```bash
cd backend
mvn clean install
```

This builds all four modules:
- `nanopay-common` — Shared DTOs, exceptions, constants
- `nanopay-core` — Domain logic, security, entities
- `nanopay-infrastructure` — DB, Kafka, Redis, email, WebSocket adapters
- `nanopay-api` — REST layer, entry point, exception handler

### 2. Start Infrastructure

From the project root:

```bash
cd infra
docker compose --env-file ../.env.dev up -d
```

This spins up:
- **MySQL 8** (port 3306) — main database
- **Redis 7** (port 6379) — cache & session store
- **Kafka** (port 9092) — async events (topics auto-created)
- **Elasticsearch 8.13** (port 9200) — log aggregation
- **Logstash** (port 5000) — log ingestion pipeline
- **Kibana** (port 5601) — log visualization
- **Prometheus** (port 9090) — metrics storage
- **Grafana** (port 3001) — dashboards (admin/admin)

Check status:
```bash
docker compose ps
```

### 3. Run Backend API

```bash
cd backend/nanopay-api
mvn spring-boot:run
```

API starts on `http://localhost:8080`

**Swagger UI:** `http://localhost:8080/swagger-ui.html`
**Health:** `http://localhost:8080/actuator/health`
**Prometheus metrics:** `http://localhost:8080/actuator/prometheus`

### 4. Frontend (Placeholder)

```bash
cd frontend
npm install
npm start
```

Frontend starts on `http://localhost:3000` (configured in `.env.dev` CORS settings)

---

## Architecture Overview

### Hexagonal Structure
- **Domain Layer** (`nanopay-core`) — Pure business logic, frameworks-agnostic
- **Application Layer** (`nanopay-api`) — Controllers, exception handling, DTOs
- **Infrastructure Layer** (`nanopay-infrastructure`) — DB, Kafka, Redis, external APIs
- **Common** (`nanopay-common`) — Shared utilities, no Spring deps

This separation allows testing core business logic without containers.

### Security Decisions
- JWT (JJWT 0.12.x) for stateless auth
- OAuth2 ready for Google login
- Rate limiting via Bucket4j + Redis
- Account lockout after 5 failed login attempts
- Fraud detection flags (single transaction limit, daily limit, velocity checks)
- Idempotency keys to prevent duplicate transaction processing
- All secrets injected from environment — NO hardcoded defaults in prod config

### Data Consistency
- Flyway migrations (version-controlled schema)
- Transactional Kafka producers (no partial publishes)
- Redis key prefixes for namespacing (no collisions)
- MySQL connection pooling (HikariCP) tuned per environment

### Observability
- **Logging**: SLF4J → Logstash → Elasticsearch → Kibana
- **Metrics**: Micrometer → Prometheus → Grafana
- **Health Checks**: Actuator endpoints for container orchestration

---

## Configuration Profiles

### Development (`.env.dev`)
- Verbose logging, schema validation
- Swagger UI enabled
- SQL query logging
- Relaxed CORS: `http://localhost:3000`

### Production (`.env.prod` — create manually)
Template:
```dotenv
APP_PROFILE=prod
DB_HOST=your-prod-db-host
DB_PORT=3306
DB_NAME=nanopay_prod
DB_USERNAME=nanopay_user
DB_PASSWORD=<STRONG_PASSWORD>
REDIS_HOST=your-prod-redis-host
REDIS_PASSWORD=<STRONG_PASSWORD>
KAFKA_BOOTSTRAP_SERVERS=kafka-1:9092,kafka-2:9092,kafka-3:9092
JWT_SECRET=<64_BYTE_BASE64_KEY_FROM_OPENSSL>
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=<SENDGRID_API_KEY>
GOOGLE_CLIENT_ID=<YOUR_GOOGLE_OAUTH_ID>
GOOGLE_CLIENT_SECRET=<YOUR_GOOGLE_OAUTH_SECRET>
CORS_ALLOWED_ORIGINS=https://app.nanopay.com
GRAFANA_PASSWORD=<STRONG_PASSWORD>
```

**Never commit `.env.prod` to version control.** Use a secrets manager in CI/CD.

---

## Kafka Topics

All topics are created automatically on first startup. Partitioning strategy:

| Topic | Partitions | Use Case |
|-------|------------|----------|
| `transaction-initiated` | 3 | Transaction flow entry |
| `transaction-completed` | 3 | Audit trail, analytics |
| `fraud-alert` | 1 | Fraud review queue (single consumer) |
| `notification` | 3 | Email/SMS dispatch |
| `transaction-initiated.DLQ` | 1 | Failed message inspection |
| `transaction-completed.DLQ` | 1 | Failed message inspection |

---

## Database Migrations

Place Flyway migrations in:
```
backend/nanopay-infrastructure/src/main/resources/db/migration/
```

Naming convention: `V001__initial_schema.sql`

Example:
```sql
-- V001__initial_schema.sql
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Migrations run automatically on app startup. On schema drift, startup fails (validation mode).

---

## Testing Strategy

### Unit Tests
- Business logic in `nanopay-core` tested without containers
- MapStruct mappers tested in `nanopay-api`

### Integration Tests
- Use Testcontainers for MySQL, Kafka in `nanopay-infrastructure`
- @SpringBootTest with `@ActiveProfiles("test")` profile

Example:
```java
@Testcontainers
class TransactionIntegrationTest {
    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0");
    
    // tests with real MySQL, no mocks
}
```

---

## Monitoring & Alerting

### Prometheus Queries (Examples)

```promql
# HTTP request rate (requests/sec)
rate(http_requests_total[5m])

# P95 request latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Kafka consumer lag
kafka_consumer_lag_sum

# JVM memory usage
jvm_memory_used_bytes
```

### Grafana Dashboards
Import pre-built dashboards from Grafana Hub or create custom ones.

---

## Troubleshooting

### Containers won't start
```bash
docker compose down -v  # remove all data
docker compose up -d    # fresh start
```

### Database migration fails
Check Flyway migration files in `db/migration/` directory. Ensure numbering is sequential.

### Kafka topics not created
```bash
docker exec nanopay-kafka kafka-topics --list --bootstrap-server localhost:9092
```

### Logs not flowing to Kibana
Check Logstash health:
```bash
docker logs nanopay-logstash
```

---

## Next Steps (Phase 2)

- [ ] Entity models & repositories (JPA)
- [ ] Authentication service (JWT + OAuth2)
- [ ] Transaction service & state machine
- [ ] Fraud detection engine
- [ ] WebSocket notifications
- [ ] Frontend React components
- [ ] API tests with MockMvc
- [ ] Load testing (k6 or JMeter)

---

## Security Checklist

- [ ] Rotate JWT secret in production
- [ ] Enable HTTPS/TLS in Nginx reverse proxy
- [ ] Enable SSL verification for Elasticsearch in production
- [ ] Restrict Prometheus/Grafana access to internal network only
- [ ] Use AWS Secrets Manager or HashiCorp Vault for credentials
- [ ] Enable audit logging for sensitive operations
- [ ] Regular dependency updates (`mvn clean verify`)
- [ ] OWASP dependency-check scanning in CI

---

**Architecture by design: scalable, secure, observable.**
