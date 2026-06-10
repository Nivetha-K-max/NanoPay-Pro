package com.nanopay.infrastructure.kafka.consumer;

import com.nanopay.common.constants.KafkaTopics;
import com.nanopay.common.event.NotificationEvent;
import com.nanopay.core.domain.entity.Notification;
import com.nanopay.core.domain.entity.User;
import com.nanopay.core.service.NotificationService;
import com.nanopay.infrastructure.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Terminal consumer for the notification topic.
 * Persists notification to DB and dispatches via the configured channel.
 * Uses a separate group ID so notification lag doesn't affect other consumers.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationConsumer {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    private static final String NOTIFICATION_GROUP = "nanopay-notification-consumer-group";

    @KafkaListener(
        topics = KafkaTopics.NOTIFICATION,
        groupId = NOTIFICATION_GROUP,
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(ConsumerRecord<String, NotificationEvent> record,
                        Acknowledgment ack) {

        NotificationEvent event = record.value();

        try {
            // Null userId = admin broadcast (from fraud alert consumer)
            if (event.getUserId() == null) {
                handleAdminBroadcast(event);
            } else {
                handleUserNotification(event);
            }

            ack.acknowledge();

        } catch (Exception e) {
            log.error("Failed to process notification event: userId={}, type={}, error={}",
                event.getUserId(), event.getType(), e.getMessage(), e);
            throw e;
        }
    }

    private void handleUserNotification(NotificationEvent event) {
        User user = userRepository.findById(event.getUserId()).orElse(null);
        if (user == null) {
            log.warn("Notification target user not found: userId={}", event.getUserId());
            return;  // ack anyway — user was deleted; don't retry forever
        }

        boolean sendEmail = "BOTH".equals(event.getChannel())
                         || "EMAIL".equals(event.getChannel());
        boolean sendInApp = "BOTH".equals(event.getChannel())
                         || "IN_APP".equals(event.getChannel());

        if (sendInApp) {
            notificationService.createInAppNotification(user, event);
        }
        if (sendEmail) {
            notificationService.sendEmailNotification(user, event);
        }

        log.debug("Notification dispatched: userId={}, type={}, channels={}",
            event.getUserId(), event.getType(), event.getChannel());
    }

    private void handleAdminBroadcast(NotificationEvent event) {
        // Load all admin users and notify each
        List<User> admins = userRepository.findByRoleName(
            "ROLE_ADMIN",
            org.springframework.data.domain.Pageable.ofSize(100)
        );

        for (User admin : admins) {
            notificationService.createInAppNotification(admin, event);
            notificationService.sendEmailNotification(admin, event);
        }

        log.info("Admin broadcast dispatched to {} admins: type={}", admins.size(), event.getType());
    }
}
