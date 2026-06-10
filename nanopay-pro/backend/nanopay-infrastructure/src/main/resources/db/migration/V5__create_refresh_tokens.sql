-- V5: Refresh token storage
-- Stored in DB (not just Redis) for cross-device revocation and audit trail.
-- Redis is used for fast lookup; DB is the source of truth.

CREATE TABLE refresh_tokens (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    token_hash      VARCHAR(255)    NOT NULL,   -- SHA-256 hash, never store raw token
    user_id         BIGINT          NOT NULL,
    device_info     VARCHAR(500),               -- browser/device fingerprint
    ip_address      VARCHAR(45),
    expires_at      DATETIME(6)     NOT NULL,
    revoked         BOOLEAN         NOT NULL DEFAULT FALSE,
    revoked_at      DATETIME(6),
    revoke_reason   VARCHAR(100),               -- LOGOUT | PASSWORD_CHANGE | ADMIN_REVOKE | ROTATION
    created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_refresh_tokens PRIMARY KEY (id),
    CONSTRAINT uq_refresh_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_refresh_user     (user_id, revoked),
    INDEX idx_refresh_hash     (token_hash),        -- covered by UQ but explicit for readability
    INDEX idx_refresh_expires  (expires_at)         -- cleanup job target
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
