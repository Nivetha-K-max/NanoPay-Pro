-- V1: Core identity tables
-- Roles table is created before users because users.role_id references it.
-- We use ENUM-like role names stored as VARCHAR to allow future role additions
-- without a schema migration.

CREATE TABLE roles (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    name        VARCHAR(50)     NOT NULL,
    description VARCHAR(255),
    created_at  DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_roles PRIMARY KEY (id),
    CONSTRAINT uq_roles_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed the three roles immediately — they are referenced by FK from users.
-- Using INSERT IGNORE so re-running migration in tests doesn't fail.
INSERT IGNORE INTO roles (name, description) VALUES
    ('ROLE_ADMIN',    'Platform administrator with full access'),
    ('ROLE_MERCHANT', 'Merchant account with payment and settlement access'),
    ('ROLE_CUSTOMER', 'End customer with wallet and transfer access');


CREATE TABLE users (
    id                      BIGINT          NOT NULL AUTO_INCREMENT,
    email                   VARCHAR(255)    NOT NULL,
    password_hash           VARCHAR(255),           -- NULL for OAuth2-only accounts
    first_name              VARCHAR(100)    NOT NULL,
    last_name               VARCHAR(100)    NOT NULL,
    phone_number            VARCHAR(20),
    role_id                 BIGINT          NOT NULL,
    status                  VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',
                                                    -- ACTIVE | SUSPENDED | LOCKED | PENDING_VERIFICATION
    email_verified          BOOLEAN         NOT NULL DEFAULT FALSE,
    failed_login_attempts   INT             NOT NULL DEFAULT 0,
    locked_until            DATETIME(6),            -- NULL means not locked
    last_login_at           DATETIME(6),
    password_changed_at     DATETIME(6),
    oauth2_provider         VARCHAR(50),            -- 'google' | NULL for local accounts
    oauth2_provider_id      VARCHAR(255),           -- provider's user ID
    profile_image_url       VARCHAR(500),
    created_at              DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at              DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    version                 BIGINT          NOT NULL DEFAULT 0,  -- optimistic locking

    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_oauth2 UNIQUE (oauth2_provider, oauth2_provider_id),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE','SUSPENDED','LOCKED','PENDING_VERIFICATION')),

    -- Auth queries: login by email, lock check by email
    INDEX idx_users_email (email),
    INDEX idx_users_status (status),
    INDEX idx_users_role (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
