package com.nanopay.core.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DECIMAL via BigDecimal — never use double/float for money.
 *
 * Pessimistic locking note: the transaction engine acquires a SELECT FOR UPDATE
 * lock on wallet rows via LockModeType.PESSIMISTIC_WRITE in the repository.
 * The @Version here provides a secondary optimistic lock for non-transaction
 * updates (profile changes, limit adjustments).
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "wallets")
public class Wallet extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(nullable = false, length = 3)
    private String currency = "USD";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WalletStatus status = WalletStatus.ACTIVE;

    @Column(name = "daily_spent", nullable = false, precision = 19, scale = 4)
    private BigDecimal dailySpent = BigDecimal.ZERO;

    @Column(name = "daily_limit", nullable = false, precision = 19, scale = 4)
    private BigDecimal dailyLimit = new BigDecimal("50000.0000");

    @Column(name = "last_reset_date", nullable = false)
    private LocalDate lastResetDate = LocalDate.now();

    @Version
    @Column(nullable = false)
    private Long version = 0L;

    // ── Domain methods ─────────────────────────────────────────────────────

    /**
     * Debit the wallet. Called within a pessimistic-lock transaction.
     * Throws if insufficient funds — never allow negative balance.
     */
    public void debit(BigDecimal amount) {
        if (balance.compareTo(amount) < 0) {
            throw new com.nanopay.common.exception.InsufficientFundsException();
        }
        this.balance = this.balance.subtract(amount);
        this.dailySpent = this.dailySpent.add(amount);
    }

    public void credit(BigDecimal amount) {
        this.balance = this.balance.add(amount);
    }

    public boolean hasSufficientBalance(BigDecimal amount) {
        return balance.compareTo(amount) >= 0;
    }

    /**
     * Resets daily spend counter. Called by scheduled job at midnight UTC.
     */
    public void resetDailySpend() {
        this.dailySpent = BigDecimal.ZERO;
        this.lastResetDate = LocalDate.now();
    }

    public boolean isActive() {
        return status == WalletStatus.ACTIVE;
    }

    public enum WalletStatus {
        ACTIVE, FROZEN, CLOSED
    }
}
