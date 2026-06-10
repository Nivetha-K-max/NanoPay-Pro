package com.nanopay.infrastructure.kafka.consumer;

import com.nanopay.common.constants.KafkaTopics;
import com.nanopay.common.event.NotificationEvent;
import com.nanopay.common.event.TransactionEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

/**
 * Consumes fraud-alert topic events.
 * Responsibilities:
 * 1. Notify the admin team of high-risk transactions
 * 2. Log at WARN for Grafana alert rules
 *
 * This consumer has its own group ID so fraud alerts are processed
 * independently of the main consumer group — a lag in fraud processing
 * doesn't affect transaction completion notifications.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FraudAlertConsumer {

    private final KafkaTemplate<String, NotificationEvent> notificationTemplate;

    // Separate group ID — fraud alerts need their own offset tracking
    private static final String FRAUD_GROUP = "nanopay-fraud-consumer-group";

    @KafkaListener(
        topics = KafkaTopics.FRAUD_ALERT,
        groupId = FRAUD_GROUP,
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(ConsumerRecord<String, TransactionEvent> record,
                        Acknowledgment ack) {

        TransactionEvent event = record.value();

        try {
            // Structured log — Grafana alert rule triggers on level=WARN + "FRAUD_ALERT"
            log.warn("FRAUD_ALERT: txId={}, userId={}, amount={} {}, score={}, ip={}",
                event.getTransactionId(),
                event.getSenderUserId(),
                event.getCurrency(),
                event.getAmount(),
                event.getFraudScore(),
                event.getIpAddress()
            );

            // Notify all admins — we publish to the notification topic
            // with a special admin channel type.
            // The notification consumer handles routing to admin users.
            NotificationEvent adminAlert = NotificationEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .userId(null)           // null = broadcast to all admins (handled in consumer)
                .type("FRAUD_ALERT")
                .title("Fraud Alert: High-Risk Transaction Detected")
                .body(String.format(
                    "Transaction %s flagged. Amount: %s %s. Score: %.0f. IP: %s",
                    event.getReferenceNumber(),
                    event.getCurrency(),
                    event.getAmount(),
                    event.getFraudScore().doubleValue(),
                    event.getIpAddress()
                ))
                .referenceId(event.getTransactionId())
                .referenceType("TRANSACTION")
                .channel("BOTH")
                .occurredAt(Instant.now())
                .build();

            notificationTemplate.send(KafkaTopics.NOTIFICATION,
                "admin-broadcast", adminAlert);

            ack.acknowledge();

        } catch (Exception e) {
            log.error("Failed to process fraud-alert event: txId={}, error={}",
                event.getTransactionId(), e.getMessage(), e);
            throw e;
        }
    }
}
