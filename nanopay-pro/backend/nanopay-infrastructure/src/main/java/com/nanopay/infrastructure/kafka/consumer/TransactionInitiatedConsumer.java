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
 * Consumes transaction-initiated events.
 * Responsibilities:
 * 1. Log the event for observability (structured log picked up by Logstash)
 * 2. Publish a notification event for real-time "transaction pending" alert
 *
 * The consumer does NOT perform financial operations — those happened in the
 * TransactionService within the DB transaction. This consumer handles
 * async side effects only.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TransactionInitiatedConsumer {

    private final KafkaTemplate<String, NotificationEvent> notificationKafkaTemplate;

    @KafkaListener(
        topics = KafkaTopics.TRANSACTION_INITIATED,
        groupId = "${spring.kafka.consumer.group-id}",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(ConsumerRecord<String, TransactionEvent> record,
                        Acknowledgment ack) {

        TransactionEvent event = record.value();

        try {
            log.info("Transaction initiated: txId={}, type={}, amount={} {}, status={}",
                event.getTransactionId(),
                event.getTransactionType(),
                event.getAmount(),
                event.getCurrency(),
                event.getStatus()
            );

            // Publish pending notification to sender (if transfer/withdrawal)
            if (event.getSenderUserId() != null) {
                publishPendingNotification(event, event.getSenderUserId(), "sender");
            }

            // Acknowledge offset — processing complete
            ack.acknowledge();

        } catch (Exception e) {
            // Do NOT call ack — the error handler will retry, then DLQ
            log.error("Failed to process transaction-initiated event: txId={}, error={}",
                event.getTransactionId(), e.getMessage(), e);
            throw e;  // rethrow so the error handler kicks in
        }
    }

    private void publishPendingNotification(TransactionEvent event,
                                             Long userId, String role) {
        String body = String.format(
            "Your %s of %s %s is being processed. Reference: %s",
            event.getTransactionType().toLowerCase(java.util.Locale.ROOT),
            event.getCurrency(),
            event.getAmount(),
            event.getReferenceNumber()
        );

        NotificationEvent notification = NotificationEvent.builder()
            .eventId(UUID.randomUUID().toString())
            .userId(userId)
            .type("TRANSACTION_SUCCESS")  // will update to final status later
            .title("Transaction Pending")
            .body(body)
            .referenceId(event.getTransactionId())
            .referenceType("TRANSACTION")
            .channel("IN_APP")
            .occurredAt(Instant.now())
            .build();

        notificationKafkaTemplate.send(KafkaTopics.NOTIFICATION,
            userId.toString(), notification);
    }
}
