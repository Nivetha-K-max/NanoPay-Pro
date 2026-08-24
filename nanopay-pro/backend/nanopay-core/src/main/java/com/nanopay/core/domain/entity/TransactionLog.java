package com.nanopay.core.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.Map;

/**
 * Immutable audit record. Once created, rows are never updated.
 * The @PreUpdate guard enforces this at the JPA layer as a safety net —
 * the real enforcement is "don't call entityManager.merge() on these".
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "transaction_logs")
@EntityListeners(AuditingEntityListener.class)
public class TransactionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", nullable = false)
    private Transaction transaction;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 20)
    private Transaction.TransactionStatus fromStatus;  // null on initial PENDING entry

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 20)
    private Transaction.TransactionStatus toStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by")
    private User changedBy;  // null for system-initiated transitions

    @Column(length = 500)
    private String reason;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSON")
    private Map<String, Object> metadata;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PreUpdate
    protected void onUpdate() {
        // Immutability guard — should never be reached in correct code.
        // If it is, something is trying to update an audit record, which is a bug.
        throw new IllegalStateException(
            "TransactionLog records are immutable. Attempted update on log id=" + id
        );
    }
}
