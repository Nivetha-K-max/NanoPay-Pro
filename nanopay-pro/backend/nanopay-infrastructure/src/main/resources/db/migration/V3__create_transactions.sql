-- V3: Transaction and transaction log tables
-- The transactions table is the financial ledger — every money movement lives here.
-- transaction_logs is the immutable audit trail — every status change is a new row,
-- never an UPDATE to an existing row.

CREATE TABLE transactions (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    reference_number    VARCHAR(36)     NOT NULL,   -- UUID, shown to users
    idempotency_key     VARCHAR(255)    NOT NULL,   -- client-provided dedup key
    type                VARCHAR(20)     NOT NULL,   -- DEPOSIT | WITHDRAWAL | TRANSFER | REVERSAL
    status              VARCHAR(20)     NOT NULL DEFAULT 'PENDING',
                                                    -- PENDING | PROCESSING | SUCCESS | FAILED | REVERSED
    sender_wallet_id    BIGINT,                     -- NULL for DEPOSIT (external source)
    receiver_wallet_id  BIGINT,                     -- NULL for WITHDRAWAL (external destination)
    amount              DECIMAL(19,4)   NOT NULL,
    currency            VARCHAR(3)      NOT NULL DEFAULT 'USD',
    fee                 DECIMAL(19,4)   NOT NULL DEFAULT 0.0000,
    net_amount          DECIMAL(19,4)   NOT NULL,   -- amount - fee, stored for audit clarity
    description         VARCHAR(500),
    metadata            JSON,                       -- flexible extra data (merchant ref, IP, device)
    fraud_score         DECIMAL(5,2)    NOT NULL DEFAULT 0.00,  -- 0.00-100.00
    fraud_checked       BOOLEAN         NOT NULL DEFAULT FALSE,
    ip_address          VARCHAR(45),                -- IPv4 or IPv6
    initiated_by        BIGINT          NOT NULL,   -- user_id who triggered the transaction
    reversed_by_id      BIGINT,                     -- transaction_id of the reversal tx, if any
    completed_at        DATETIME(6),
    created_at          DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    version             BIGINT          NOT NULL DEFAULT 0,

    CONSTRAINT pk_transactions PRIMARY KEY (id),
    CONSTRAINT uq_transactions_reference UNIQUE (reference_number),
    CONSTRAINT uq_transactions_idempotency UNIQUE (idempotency_key),
    CONSTRAINT fk_transactions_sender FOREIGN KEY (sender_wallet_id)
        REFERENCES wallets(id) ON DELETE RESTRICT,
    CONSTRAINT fk_transactions_receiver FOREIGN KEY (receiver_wallet_id)
        REFERENCES wallets(id) ON DELETE RESTRICT,
    CONSTRAINT fk_transactions_initiator FOREIGN KEY (initiated_by)
        REFERENCES users(id),
    CONSTRAINT chk_transactions_amount CHECK (amount > 0),
    CONSTRAINT chk_transactions_type CHECK (type IN ('DEPOSIT','WITHDRAWAL','TRANSFER','REVERSAL')),
    CONSTRAINT chk_transactions_status CHECK (
        status IN ('PENDING','PROCESSING','SUCCESS','FAILED','REVERSED')
    ),

    -- High-frequency query patterns:
    INDEX idx_tx_sender_wallet   (sender_wallet_id, created_at),    -- wallet history
    INDEX idx_tx_receiver_wallet (receiver_wallet_id, created_at),  -- wallet history
    INDEX idx_tx_status          (status),                          -- processing queue
    INDEX idx_tx_reference       (reference_number),                -- user lookup
    INDEX idx_tx_idempotency     (idempotency_key),                 -- dedup check (covered by UQ)
    INDEX idx_tx_initiated_by    (initiated_by, created_at),        -- user's own transactions
    INDEX idx_tx_created_at      (created_at),                      -- time-range reporting
    INDEX idx_tx_fraud_score     (fraud_score, fraud_checked)       -- fraud review queue
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Immutable audit trail for every transaction state transition.
-- Rows are INSERT-only. No UPDATEs or DELETEs ever.
CREATE TABLE transaction_logs (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    transaction_id  BIGINT          NOT NULL,
    from_status     VARCHAR(20),                    -- NULL on initial PENDING entry
    to_status       VARCHAR(20)     NOT NULL,
    changed_by      BIGINT,                         -- user_id or NULL for system actions
    reason          VARCHAR(500),                   -- human-readable reason for state change
    metadata        JSON,                           -- extra context (error message, fraud reason)
    created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_transaction_logs PRIMARY KEY (id),
    CONSTRAINT fk_tx_logs_transaction FOREIGN KEY (transaction_id)
        REFERENCES transactions(id) ON DELETE RESTRICT,

    INDEX idx_tx_logs_transaction (transaction_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
