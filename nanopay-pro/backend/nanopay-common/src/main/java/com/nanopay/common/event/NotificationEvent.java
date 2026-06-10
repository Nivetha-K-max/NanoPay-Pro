package com.nanopay.common.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Kafka message for triggering notifications.
 * Produced by consumers after processing a transaction event.
 * Consumed by the notification consumer to create DB records
 * and dispatch emails/WebSocket pushes.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEvent {

    private String eventId;
    private Long   userId;           // recipient
    private String type;             // matches Notification.NotificationType
    private String title;
    private String body;
    private Long   referenceId;      // transaction ID
    private String referenceType;    // "TRANSACTION"
    private String channel;          // IN_APP | EMAIL | BOTH
    private Instant occurredAt;
}
