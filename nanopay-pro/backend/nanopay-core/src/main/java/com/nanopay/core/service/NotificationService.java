package com.nanopay.core.service;

import com.nanopay.common.event.NotificationEvent;
import com.nanopay.core.domain.entity.Notification;
import com.nanopay.core.domain.entity.NotificationPreference;
import com.nanopay.core.domain.entity.User;
import com.nanopay.core.repository.NotificationRepository;
import com.nanopay.infrastructure.repository.NotificationPreferenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final JavaMailSender mailSender;
    private final WebSocketNotificationService webSocketService;
    private final NotificationPreferenceRepository notificationPreferenceRepository;

    private boolean shouldSend(User user,
                                Notification.NotificationType type,
                                Notification.Channel channel) {
        return notificationPreferenceRepository
            .findByUserId(user.getId())
            .orElse(NotificationPreference.defaultsFor(user))
            .shouldDeliver(type, channel);
    }

    /**
     * Persist to DB + push via WebSocket.
     * Called from the Kafka consumer thread — must be @Transactional
     * because the consumer is outside the normal request transaction scope.
     */
    @Transactional
    public void createInAppNotification(User user, NotificationEvent event) {
        Notification.NotificationType type = parseType(event.getType());

        if (!shouldSend(user, type, Notification.Channel.IN_APP)) {
            return;
        }

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setTitle(event.getTitle());
        notification.setBody(event.getBody());
        notification.setReferenceId(event.getReferenceId());
        notification.setReferenceType(event.getReferenceType());
        notification.setChannel(Notification.Channel.IN_APP);
        notification.setDeliveryStatus(Notification.DeliveryStatus.SENT);
        notification.setSentAt(Instant.now());
        notificationRepository.save(notification);

        // Push real-time update via WebSocket
        webSocketService.sendToUser(user.getId(), notification);
    }

    /**
     * Send email asynchronously — mail delivery latency must not
     * block the Kafka consumer thread or cause offset commit delay.
     */
    @Async
    @Transactional
    public void sendEmailNotification(User user, NotificationEvent event) {
        Notification.NotificationType type = parseType(event.getType());

        if (!shouldSend(user, type, Notification.Channel.EMAIL)) {
            return;
        }

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setTitle(event.getTitle());
        notification.setBody(event.getBody());
        notification.setReferenceId(event.getReferenceId());
        notification.setReferenceType(event.getReferenceType());
        notification.setChannel(Notification.Channel.EMAIL);
        notification.setDeliveryStatus(Notification.DeliveryStatus.PENDING);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("[NanoPay] " + event.getTitle());
            message.setText(buildEmailBody(user, event));
            message.setFrom("noreply@nanopay.com");

            mailSender.send(message);

            notification.setDeliveryStatus(Notification.DeliveryStatus.DELIVERED);
            notification.setSentAt(Instant.now());

            log.debug("Email sent: userId={}, type={}", user.getId(), event.getType());

        } catch (Exception e) {
            notification.setDeliveryStatus(Notification.DeliveryStatus.FAILED);
            log.error("Email delivery failed: userId={}", user.getId(), e);
        }

        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public Page<Notification> getNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public int markAllRead(Long userId) {
        return notificationRepository.markAllAsRead(userId);
    }

    @Transactional
    public void markRead(Long notificationId, Long userId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getUser().getId().equals(userId)) {
                n.markAsRead();
                notificationRepository.save(n);
            }
        });
    }

    private String buildEmailBody(User user, NotificationEvent event) {
        return String.format(
            "Hello %s,\n\n%s\n\nReference: %s\n\n" +
                "If you did not initiate this action, please contact support immediately.\n\n" +
                "— The NanoPay Team",
            user.getFirstName(),
            event.getBody(),
            event.getReferenceId() != null ? event.getReferenceId().toString() : "N/A"
        );
    }

    private Notification.NotificationType parseType(String type) {
        try {
            return Notification.NotificationType.valueOf(type);
        } catch (IllegalArgumentException e) {
            return Notification.NotificationType.SYSTEM_MESSAGE;
        }
    }
}

