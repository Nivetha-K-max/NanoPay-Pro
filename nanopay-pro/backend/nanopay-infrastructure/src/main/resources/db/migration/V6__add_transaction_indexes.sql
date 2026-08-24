-- V6: Additional indexes for transaction engine query patterns discovered in Phase 4
-- These are added separately to avoid locking the transactions table
-- during the initial schema creation with seed data.

-- Composite index for idempotency lookup — the most performance-critical query
-- in the transaction engine (called on every write operation)
ALTER TABLE transactions
    ADD INDEX idx_tx_idempotency_status (idempotency_key, status);

-- Index supporting the fraud velocity query:
-- "count transactions from wallet X in the last N minutes where status != FAILED"
ALTER TABLE transactions
    ADD INDEX idx_tx_sender_status_created (sender_wallet_id, status, created_at);

-- Index for daily spend sum query used by fraud engine
ALTER TABLE transactions
    ADD INDEX idx_tx_sender_created_status (sender_wallet_id, created_at, status);
