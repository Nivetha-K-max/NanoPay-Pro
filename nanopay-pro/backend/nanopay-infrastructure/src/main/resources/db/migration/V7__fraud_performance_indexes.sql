-- V7: Indexes supporting fraud detection query patterns
-- These queries run synchronously in the request path — they must be fast.

-- Velocity rule: count recent transactions per wallet
ALTER TABLE transactions
    ADD INDEX idx_tx_fraud_velocity
        (sender_wallet_id, created_at, status);

-- Geo anomaly: most recent IP per wallet
ALTER TABLE transactions
    ADD INDEX idx_tx_fraud_geo
        (sender_wallet_id, created_at DESC, ip_address);

-- Fraud flag review queue: open flags by severity (admin dashboard)
ALTER TABLE fraud_flags
    ADD INDEX idx_fraud_review_queue
        (status, severity, created_at DESC);

-- Active flag count per user (used by FraudHistoryRule and auto-block check)
ALTER TABLE fraud_flags
    ADD INDEX idx_fraud_active_per_user
        (user_id, status);

-- High-risk transaction queue (admin dashboard)
ALTER TABLE transactions
    ADD INDEX idx_tx_high_risk
        (fraud_score DESC, fraud_checked, created_at DESC);
