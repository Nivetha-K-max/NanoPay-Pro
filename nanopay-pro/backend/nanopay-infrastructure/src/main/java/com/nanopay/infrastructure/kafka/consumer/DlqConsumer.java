package com.nanopay.infrastructure.kafka.consumer;

import com.nanopay.common.event.TransactionEvent;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

/**
 * Dead Letter Queue consumer.
 * Messages land here after the main consumer has exhausted retries.
 *
 * This consumer does NOT reprocess — it only logs and acknowledges.
 * Reprocessing is a manual operational decision (use the Kafka CLI or
 * a replay tool to re-publish from DLQ to the original topic after
 * fixing the root cause).
 *
 * In production, a PagerDuty/alerting integration would trigger here.
 */
@Slf4j
@Component
public class DlqConsumer {

    @KafkaListener(
        topics = {
            "transaction-initiated.DLQ",
            "transaction-completed.DLQ"
        },
        groupId = "nanopay-dlq-consumer-group",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void consumeDlq(ConsumerRecord<String, TransactionEvent> record,
                           Acknowledgment ack) {

        TransactionEvent event = record.value();

        // CRITICAL log level — monitored by Grafana alerting rule
        log.error("DLQ_MESSAGE_RECEIVED: topic={}, partition={}, offset={}, " +
                  "txId={}, type={}, status={}, amount={} {}. " +
                  "Manual investigation required.",
            record.topic(),
            record.partition(),
            record.offset(),
            event != null ? event.getTransactionId() : "DESERIALIZATION_FAILED",
            event != null ? event.getTransactionType() : "UNKNOWN",
            event != null ? event.getStatus() : "UNKNOWN",
            event != null ? event.getCurrency() : "",
            event != null ? event.getAmount() : ""
        );

        // Acknowledge to advance offset — do not leave DLQ messages unprocessed
        // or the consumer will stall and accumulate unbounded lag
        ack.acknowledge();
    }
}
