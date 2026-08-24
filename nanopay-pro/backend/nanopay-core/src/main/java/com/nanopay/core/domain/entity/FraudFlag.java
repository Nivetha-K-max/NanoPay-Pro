package com.nanopay.core.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "fraud_flags")
public class FraudFlag extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", nullable = false)
    private Transaction transaction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "flag_type", nullable = false, length = 50)
    private FlagType flagType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Severity severity = Severity.MEDIUM;

    @Column(name = "fraud_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal fraudScore;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "JSON")
    private Map<String, Object> details;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FlagStatus status = FlagStatus.OPEN;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "review_notes", length = 1000)
    private String reviewNotes;

    public enum FlagType {
        VELOCITY_BREACH, AMOUNT_LIMIT, GEO_ANOMALY, MANUAL_REVIEW, PATTERN_MATCH
    }

    public enum Severity {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    public enum FlagStatus {
        OPEN, UNDER_REVIEW, RESOLVED_LEGITIMATE, RESOLVED_FRAUDULENT, DISMISSED
    }
}
