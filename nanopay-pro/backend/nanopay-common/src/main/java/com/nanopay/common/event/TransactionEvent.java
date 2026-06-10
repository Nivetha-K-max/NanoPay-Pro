package com.nanopay.common.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Kafka message payload for all transaction events.
 * Must be serializable to JSON — no JPA entities in events.
 * Designed for backward compatibility: add fields with defaults, never remove.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionEvent {

    private String eventId;           // UUID for deduplication
    private String eventType;         // INITIATED | COMPLETED | FAILED | REVERSED
    private String topic;             // which Kafka topic this was published to

    private Long transactionId;
    private String referenceNumber;
    private String transactionType;   // DEPOSIT | WITHDRAWAL | TRANSFER | REVERSAL
    private String status;

    private Long senderUserId;
    private Long senderWalletId;
    private Long receiverUserId;
    private Long receiverWalletId;

    private BigDecimal amount;
    private String currency;
    private BigDecimal fee;
    private BigDecimal netAmount;
    private BigDecimal fraudScore;

    private String ipAddress;
    private Instant occurredAt;
}
