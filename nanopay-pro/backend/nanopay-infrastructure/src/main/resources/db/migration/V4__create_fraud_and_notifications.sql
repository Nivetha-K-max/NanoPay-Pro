-- V4: Fraud flags, notifications, audit logs, merchant profiles

CREATE TABLE fraud_flags (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    transaction_id  BIGINT          NOT NULL,
    user_id         BIGINT          NOT NULL,
    flag_type       VARCHAR(50)     NOT NULL,
                    -- VELOCITY_BREACH | AMOUNT_LIMIT | GEO_ANOMALY | MANUAL_REVIEW | PATTERN_MATCH
    severity        VARCHAR(20)     NOT NULL DEFAULT 'MEDIUM',
                    -- LOW | MEDIUM | HIGH | CRITICAL
    fraud_score     DECIMAL(5,2)    NOT NULL,
    details         JSON            NOT NULL,       -- rule that triggered, threshold values, etc.
    status          VARCHAR(20)     NOT NULL DEFAULT 'OPEN',
                    -- OPEN | UNDER_REVIEW | RESOLVED_LEGITIMATE | RESOLVED_FRAUDULENT | DISMISSED
    reviewed_by     BIGINT,                         -- admin user_id
    reviewed_at     DATETIME(6),
    review_notes    VARCHAR(1000),
    created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_fraud_flags PRIMARY KEY (id),
    CONSTRAINT fk_fraud_transaction FOREIGN KEY (transaction_id)
        REFERENCES transactions(id),
    CONSTRAINT fk_fraud_user FOREIGN KEY (user_id)
        REFERENCES users(id),
    CONSTRAINT chk_fraud_severity CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    CONSTRAINT chk_fraud_status CHECK (
        status IN ('OPEN','UNDER_REVIEW','RESOLVED_LEGITIMATE','RESOLVED_FRAUDULENT','DISMISSED')
    ),

    INDEX idx_fraud_user       (user_id, created_at),
    INDEX idx_fraud_transaction (transaction_id),
    INDEX idx_fraud_status     (status, severity),  -- admin review queue
    INDEX idx_fraud_created    (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE notifications (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    user_id         BIGINT          NOT NULL,
    type            VARCHAR(50)     NOT NULL,
                    -- TRANSACTION_SUCCESS | TRANSACTION_FAILED | FRAUD_ALERT |
                    -- LOGIN_ALERT | SYSTEM_MESSAGE | ACCOUNT_UPDATE
    title           VARCHAR(255)    NOT NULL,
    body            TEXT            NOT NULL,
    reference_id    BIGINT,                         -- transaction_id or fraud_flag_id if applicable
    reference_type  VARCHAR(50),                    -- 'TRANSACTION' | 'FRAUD_FLAG' | NULL
    is_read         BOOLEAN         NOT NULL DEFAULT FALSE,
    read_at         DATETIME(6),
    channel         VARCHAR(20)     NOT NULL DEFAULT 'IN_APP',
                    -- IN_APP | EMAIL | SMS | PUSH
    sent_at         DATETIME(6),
    delivery_status VARCHAR(20)     NOT NULL DEFAULT 'PENDING',
                    -- PENDING | SENT | DELIVERED | FAILED
    created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_notifications PRIMARY KEY (id),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_notif_user_unread (user_id, is_read, created_at),  -- notification center query
    INDEX idx_notif_user        (user_id, created_at),
    INDEX idx_notif_delivery    (delivery_status, channel)        -- delivery retry queue
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Tamper-evident audit log for all sensitive operations.
-- Never DELETE from this table. Retention policy enforced at storage level.
CREATE TABLE audit_logs (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    user_id         BIGINT,                         -- NULL for system/anonymous actions
    action          VARCHAR(100)    NOT NULL,
                    -- LOGIN | LOGOUT | PASSWORD_CHANGE | TRANSFER | WITHDRAWAL |
                    -- ACCOUNT_LOCKED | FRAUD_FLAG_CREATED | ADMIN_ACTION | etc.
    entity_type     VARCHAR(50),                    -- 'USER' | 'TRANSACTION' | 'WALLET'
    entity_id       BIGINT,
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(500),
    request_id      VARCHAR(36),                    -- correlates to HTTP request trace
    outcome         VARCHAR(20)     NOT NULL,        -- SUCCESS | FAILURE | BLOCKED
    details         JSON,                           -- diff: {before: {...}, after: {...}}
    created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_audit_logs PRIMARY KEY (id),
    -- No FK on user_id intentionally — audit log must survive user deletion

    INDEX idx_audit_user       (user_id, created_at),
    INDEX idx_audit_entity     (entity_type, entity_id, created_at),
    INDEX idx_audit_action     (action, created_at),
    INDEX idx_audit_ip         (ip_address, created_at)           -- IP-based investigation
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE merchant_profiles (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    user_id             BIGINT          NOT NULL,
    business_name       VARCHAR(255)    NOT NULL,
    business_type       VARCHAR(100),               -- RETAIL | ECOMMERCE | SERVICES | etc.
    registration_number VARCHAR(100),               -- official business registration
    tax_id              VARCHAR(100),               -- encrypted at app level before storing
    website_url         VARCHAR(500),
    support_email       VARCHAR(255),
    support_phone       VARCHAR(20),
    status              VARCHAR(20)     NOT NULL DEFAULT 'PENDING_VERIFICATION',
                        -- PENDING_VERIFICATION | ACTIVE | SUSPENDED | REJECTED
    verification_notes  VARCHAR(1000),
    verified_by         BIGINT,                     -- admin user_id
    verified_at         DATETIME(6),
    settlement_schedule VARCHAR(20)     NOT NULL DEFAULT 'DAILY',
                        -- DAILY | WEEKLY | MONTHLY
    settlement_wallet_id BIGINT,                    -- which wallet receives settlements
    webhook_url         VARCHAR(500),
    webhook_secret      VARCHAR(255),               -- HMAC secret for webhook signature
    created_at          DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    version             BIGINT          NOT NULL DEFAULT 0,

    CONSTRAINT pk_merchant_profiles PRIMARY KEY (id),
    CONSTRAINT uq_merchant_user UNIQUE (user_id),
    CONSTRAINT fk_merchant_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_merchant_wallet FOREIGN KEY (settlement_wallet_id)
        REFERENCES wallets(id),

    INDEX idx_merchant_status (status),
    INDEX idx_merchant_user   (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
