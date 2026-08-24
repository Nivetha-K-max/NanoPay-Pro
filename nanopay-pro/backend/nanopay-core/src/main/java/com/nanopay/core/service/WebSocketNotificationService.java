package com.nanopay.core.service;

import com.nanopay.core.domain.entity.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Pushes real-time events to connected WebSocket clients.
 *
 * convertAndSendToUser resolves the user destination using Spring's
 * UserDestinationResolver — it finds the session(s) for that user
 * by the Principal set during CONNECT authentication.
 *
 * If the user is not connected, the message is silently dropped —
 * they'll see the notification when they next load the notification center.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Sends a transaction update to a specific user's WebSocket session.
     * Destination: /user/{userId}/queue/transactions
     */
    public void sendToUser(Long userId, Notification notification) {
        try {
            messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/notifications",
                Map.of(
                    "id",       notification.getId(),
                    "type",     notification.getType().name(),
                    "title",    notification.getTitle(),
                    "body",     notification.getBody(),
                    "read",     notification.isRead(),
                    "refId",    notification.getReferenceId(),
                    "refType",  notification.getReferenceType()
                )
            );
            log.debug("WebSocket push sent to userId={}", userId);
        } catch (Exception e) {
            // Non-fatal — user may be disconnected
            log.debug("WebSocket push failed for userId={}", userId, e);
        }
    }

    /**
     * Broadcasts to all admin sessions on the admin fraud feed.
     * Destination: /topic/admin/fraud
     */
    public void broadcastFraudAlert(Object payload) {
        messagingTemplate.convertAndSend("/topic/admin/fraud", payload);
    }

    /**
     * Broadcasts wallet balance update so the UI refreshes instantly
     * without a polling call.
     */
    public void sendBalanceUpdate(Long userId, java.math.BigDecimal newBalance,
                                   String currency) {
        messagingTemplate.convertAndSendToUser(
            userId.toString(),
            "/queue/balance",
            Map.of(
                "balance",  newBalance,
                "currency", currency
            )
        );
    }
}
