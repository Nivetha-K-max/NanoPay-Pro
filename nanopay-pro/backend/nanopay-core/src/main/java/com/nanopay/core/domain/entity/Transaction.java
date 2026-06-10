package com.nanopay.core.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "transactions")
public class Transaction extends BaseEntity {

    @Column(name = "reference_number", nullable = false, unique = true, length = 36)
    private String referenceNumber;  // UUID shown to users

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 255)
    private String idempotencyKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionStatus status = TransactionStatus.PENDING;

    // Nullable: DEPOSIT has no sender, WITHDRAWAL has no receiver
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_wallet_id")
    private Wallet senderWallet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_wallet_id")
    private Wallet receiverWallet;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency = "USD";

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal fee = BigDecimal.ZERO;

    @Column(name = "net_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal netAmount;  // computed: amount - fee

    @Column(length = 500)
    private String description;

    // JSON column — stores flexible metadata without schema migration
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSON")
    private Map<String, Object> metadata;

    @Column(name = "fraud_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal fraudScore = BigDecimal.ZERO;

    @Column(name = "fraud_checked", nullable = false)
    private boolean fraudChecked = false;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initiated_by", nullable = false)
    private User initiatedBy;

    @Column(name = "reversed_by_id")
    private Long reversedById;  // ID of the reversal Transaction

    @Column(name = "completed_at")
    private Instant completedAt;

    @Version
    @Column(nullable = false)
    private Long version = 0L;

    // Cascade logs: when transaction is loaded, logs load lazily on demand
    @OneToMany(mappedBy = "transaction", cascade = CascadeType.ALL,
               fetch = FetchType.LAZY, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<TransactionLog> logs = new ArrayList<>();

    // ── Domain methods ─────────────────────────────────────────────────────

    public void transitionTo(TransactionStatus newStatus, User changedBy, String reason) {
        TransactionLog log = new TransactionLog();
        log.setTransaction(this);
        log.setFromStatus(this.status);
        log.setToStatus(newStatus);
        log.setChangedBy(changedBy);
        log.setReason(reason);
        this.logs.add(log);
        this.status = newStatus;

        if (newStatus == TransactionStatus.SUCCESS || newStatus == TransactionStatus.FAILED) {
            this.completedAt = Instant.now();
        }
    }

    public boolean isPending() {
        return status == TransactionStatus.PENDING;
    }

    public boolean isReversible() {
        return status == TransactionStatus.SUCCESS && type != TransactionType.REVERSAL;
    }

    public enum TransactionType {
        DEPOSIT, WITHDRAWAL, TRANSFER, REVERSAL
    }

    public enum TransactionStatus {
        PENDING, PROCESSING, SUCCESS, FAILED, REVERSED
    }
}
