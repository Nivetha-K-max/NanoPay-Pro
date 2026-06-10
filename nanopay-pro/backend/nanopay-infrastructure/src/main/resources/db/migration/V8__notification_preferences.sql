-- V8: Per-user notification preferences
-- Users control which events they receive and via which channel.
-- Defaults: all events enabled, IN_APP always on, EMAIL opt-in per event.

CREATE TABLE notification_preferences (
    id                          BIGINT      NOT NULL AUTO_INCREMENT,
    user_id                     BIGINT      NOT NULL,

    -- Transaction events
    tx_success_in_app           BOOLEAN     NOT NULL DEFAULT TRUE,
    tx_success_email            BOOLEAN     NOT NULL DEFAULT TRUE,
    tx_failed_in_app            BOOLEAN     NOT NULL DEFAULT TRUE,
    tx_failed_email             BOOLEAN     NOT NULL DEFAULT TRUE,

    -- Security events — these cannot be disabled (always TRUE)
    -- Enforced at application layer; columns kept for schema completeness
    login_alert_in_app          BOOLEAN     NOT NULL DEFAULT TRUE,
    login_alert_email           BOOLEAN     NOT NULL DEFAULT TRUE,
    fraud_alert_in_app          BOOLEAN     NOT NULL DEFAULT TRUE,
    fraud_alert_email           BOOLEAN     NOT NULL DEFAULT TRUE,

    -- System and account events
    account_update_in_app       BOOLEAN     NOT NULL DEFAULT TRUE,
    account_update_email        BOOLEAN     NOT NULL DEFAULT FALSE,
    system_message_in_app       BOOLEAN     NOT NULL DEFAULT TRUE,
    system_message_email        BOOLEAN     NOT NULL DEFAULT FALSE,

    -- Marketing / promotional (opt-in only)
    marketing_email             BOOLEAN     NOT NULL DEFAULT FALSE,

    -- Quiet hours: suppress non-critical notifications between these hours (user's local time)
    quiet_hours_enabled         BOOLEAN     NOT NULL DEFAULT FALSE,
    quiet_hours_start           TINYINT     NOT NULL DEFAULT 22,  -- 10 PM
    quiet_hours_end             TINYINT     NOT NULL DEFAULT 8,   -- 8 AM

    created_at                  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at                  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                    ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_notification_prefs PRIMARY KEY (id),
    CONSTRAINT uq_notif_prefs_user   UNIQUE (user_id),
    CONSTRAINT fk_notif_prefs_user   FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_notif_prefs_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

