package com.nanopay.common.constants;

/**
 * Single source of truth for all Kafka topic names.
 * Both producer and consumer reference these constants — no magic strings.
 */
public final class KafkaTopics {

    private KafkaTopics() {}

    public static final String TRANSACTION_INITIATED  = "transaction-initiated";
    public static final String TRANSACTION_COMPLETED  = "transaction-completed";
    public static final String FRAUD_ALERT            = "fraud-alert";
    public static final String NOTIFICATION           = "notification";

    // Dead Letter Queues — failed events land here for manual inspection
    public static final String TRANSACTION_INITIATED_DLQ = "transaction-initiated.DLQ";
    public static final String TRANSACTION_COMPLETED_DLQ = "transaction-completed.DLQ";
}
