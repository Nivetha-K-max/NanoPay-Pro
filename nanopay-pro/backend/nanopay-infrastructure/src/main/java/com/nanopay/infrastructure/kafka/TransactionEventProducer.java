package com.nanopay.infrastructure.kafka;

import com.nanopay.common.constants.KafkaTopics;
import com.nanopay.common.event.TransactionEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * Publishes transaction domain events to Kafka.
 *
 * Partitioning: we use senderWalletId as the message key.
 * This guarantees that all events for the same wallet go to the same partition,
 * preserving ordering for that wallet's event stream.
 * Consumers processing a wallet's history see events in the correct sequence.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TransactionEventProducer {

    private final KafkaTemplate<String, TransactionEvent> kafkaTemplate;

    public void publishTransactionInitiated(TransactionEvent event) {
        publish(KafkaTopics.TRANSACTION_INITIATED, event);
    }

    public void publishTransactionCompleted(TransactionEvent event) {
        publish(KafkaTopics.TRANSACTION_COMPLETED, event);
    }

    public void publishFraudAlert(TransactionEvent event) {
        publish(KafkaTopics.FRAUD_ALERT, event);
    }

    private void publish(String topic, TransactionEvent event) {
        event.setEventId(UUID.randomUUID().toString());
        event.setTopic(topic);

        // Partition key: walletId ensures ordering per wallet
        String partitionKey = event.getSenderWalletId() != null
            ? event.getSenderWalletId().toString()
            : event.getTransactionId().toString();

        CompletableFuture<SendResult<String, TransactionEvent>> future =
            kafkaTemplate.send(topic, partitionKey, event);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                // Kafka send failed — this is logged but NOT re-thrown.
                // The transaction has already committed. Kafka failure is
                // handled by the DLQ consumer, not by rolling back money movement.
                log.error("Failed to publish {} event for tx={}: {}",
                    topic, event.getTransactionId(), ex.getMessage());
            } else {
                log.debug("Published {} event for tx={} to partition {}",
                    topic, event.getTransactionId(),
                    result.getRecordMetadata().partition());
            }
        });
    }
}
