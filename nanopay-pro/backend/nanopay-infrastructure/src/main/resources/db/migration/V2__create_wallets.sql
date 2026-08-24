-- V2: Wallet table
-- One wallet per user per currency, created automatically on registration.
-- DECIMAL(19,4) is the standard for financial amounts:
--   19 digits total prevents overflow for amounts up to ~999 trillion
--   4 decimal places handles sub-cent precision for FX and micro-transactions
-- Security: balance column uses DECIMAL, never FLOAT/DOUBLE
--   (floating-point arithmetic is non-deterministic for money)

CREATE TABLE wallets (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    user_id         BIGINT          NOT NULL,
    balance         DECIMAL(19,4)   NOT NULL DEFAULT 0.0000,
    currency        VARCHAR(3)      NOT NULL DEFAULT 'USD',   -- ISO 4217
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',
                                                              -- ACTIVE | FROZEN | CLOSED
    daily_spent     DECIMAL(19,4)   NOT NULL DEFAULT 0.0000, -- resets at midnight UTC
    daily_limit     DECIMAL(19,4)   NOT NULL DEFAULT 50000.0000,
    last_reset_date DATE            NOT NULL DEFAULT (CURRENT_DATE),
    created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    version         BIGINT          NOT NULL DEFAULT 0,  -- optimistic lock version

    CONSTRAINT pk_wallets PRIMARY KEY (id),
    CONSTRAINT uq_wallets_user_currency UNIQUE (user_id, currency),  -- one wallet per currency per user
    CONSTRAINT fk_wallets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_wallets_balance CHECK (balance >= 0),             -- no negative balances at DB level
    CONSTRAINT chk_wallets_status CHECK (status IN ('ACTIVE','FROZEN','CLOSED')),
    CONSTRAINT chk_wallets_currency CHECK (CHAR_LENGTH(currency) = 3),

    INDEX idx_wallets_user (user_id),
    INDEX idx_wallets_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
