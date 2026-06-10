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
 * Consumes transaction-completed events (SUCCESS and FAILED).
 * Responsibilities:
 * 1. Structured logging for ops dashboards and Grafana alerts
 * 2. Publish final status notifications to sender and receiver
 * 3. Trigger fraud alert topic if score is high
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TransactionCompletedConsumer {

    private final KafkaTemplate<String, NotificationEvent> notificationTemplate;
    private final KafkaTemplate<String, TransactionEvent>  transactionTemplate;

    @KafkaListener(
        topics = KafkaTopics.TRANSACTION_COMPLETED,
        groupId = "${spring.kafka.consumer.group-id}",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(ConsumerRecord<String, TransactionEvent> record,
                        Acknowledgment ack) {

        TransactionEvent event = record.value();

        try {
            boolean success = "SUCCESS".equals(event.getStatus());

            log.info("Transaction completed: txId={}, type={}, status={}, " +
                     "amount={} {}, fraudScore={}, partition={}, offset={}",
                event.getTransactionId(),
                event.getTransactionType(),
                event.getStatus(),
                event.getAmount(),
                event.getCurrency(),
                event.getFraudScore(),
                record.partition(),
                record.offset()
            );

            // Notify sender
            if (event.getSenderUserId() != null) {
                publishCompletionNotification(event, event.getSenderUserId(),
                    success, "sender");
            }

            // Notify receiver
            if (event.getReceiverUserId() != null) {
                publishCompletionNotification(event, event.getReceiverUserId(),
                    success, "receiver");
            }

            // Escalate high-score events to fraud-alert topic for additional processing
            if (event.getFraudScore() != null &&
                event.getFraudScore().doubleValue() >= 40.0) {

                transactionTemplate.send(KafkaTopics.FRAUD_ALERT,
                    event.getSenderUserId() != null
                        ? event.getSenderUserId().toString()
                        : event.getTransactionId().toString(),
                    event);

                log.warn("Fraud alert escalated: txId={}, score={}",
                    event.getTransactionId(), event.getFraudScore());
            }

            ack.acknowledge();

        } catch (Exception e) {
            log.error("Failed to process transaction-completed event: txId={}, error={}",
                event.getTransactionId(), e.getMessage(), e);
            throw e;
        }
    }

    private void publishCompletionNotification(TransactionEvent event,
                                                Long userId,
                                                boolean success,
                                                String role) {
        String notifType  = success ? "TRANSACTION_SUCCESS" : "TRANSACTION_FAILED";
        String titleVerb  = success ? "Completed" : "Failed";
        String bodyPrefix = buildBodyPrefix(event, role, success);

        NotificationEvent notification = NotificationEvent.builder()
            .eventId(UUID.randomUUID().toString())
            .userId(userId)
            .type(notifType)
            .title("Transfer " + titleVerb)
            .body(bodyPrefix)
            .referenceId(event.getTransactionId())
            .referenceType("TRANSACTION")
            .channel("BOTH")   // in-app + email
            .occurredAt(Instant.now())
            .build();

        notificationTemplate.send(KafkaTopics.NOTIFICATION,
            userId.toString(), notification);
    }

    private String buildBodyPrefix(TransactionEvent event,
                                    String role, boolean success) {
        if (!success) {
            return String.format(
                "Your %s of %s %s could not be processed. Reference: %s",
                event.getTransactionType().toLowerCase(java.util.Locale.ROOT),
                event.getCurrency(), event.getAmount(),
                event.getReferenceNumber()
            );
        }

        return switch (role) {
            case "sender" -> String.format(
                "You sent %s %s successfully. Net amount: %s %s. Ref: %s",
                event.getCurrency(), event.getAmount(),
                event.getCurrency(), event.getNetAmount(),
                event.getReferenceNumber()
            );
            case "receiver" -> String.format(
                "You received %s %s. Reference: %s",
                event.getCurrency(), event.getNetAmount(),
                event.getReferenceNumber()
            );
            default -> String.format("Transaction %s %s. Ref: %s",
                event.getCurrency(), event.getAmount(),
                event.getReferenceNumber()
            );
        };
    }
}
