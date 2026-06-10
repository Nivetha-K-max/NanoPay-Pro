package com.nanopay.core.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * Per-user notification channel preferences.
 *
 * Security events (login alerts, fraud alerts) are always delivered
 * regardless of user preference — enforced in NotificationPreference#shouldDeliver.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "notification_preferences")
@EntityListeners(AuditingEntityListener.class)
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // Transaction events
    private boolean txSuccessInApp = true;
    private boolean txSuccessEmail = true;
    private boolean txFailedInApp = true;
    private boolean txFailedEmail = true;

    // Security — always on
    private boolean loginAlertInApp = true;
    private boolean loginAlertEmail = true;
    private boolean fraudAlertInApp = true;
    private boolean fraudAlertEmail = true;

    // Account / system
    private boolean accountUpdateInApp = true;
    private boolean accountUpdateEmail = false;
    private boolean systemMessageInApp = true;
    private boolean systemMessageEmail = false;

    // Marketing
    private boolean marketingEmail = false;

    // Quiet hours (UTC, per current project assumption)
    private boolean quietHoursEnabled = false;
    private int quietHoursStart = 22;
    private int quietHoursEnd = 8;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public boolean shouldDeliver(Notification.NotificationType type,
                                  Notification.Channel channel) {
        // Security events are always delivered — no user preference can disable them
        if (type == Notification.NotificationType.FRAUD_ALERT ||
            type == Notification.NotificationType.LOGIN_ALERT) {
            return true;
        }

        boolean channelAllowed = switch (type) {
            case TRANSACTION_SUCCESS -> channel == Notification.Channel.IN_APP
                ? txSuccessInApp : txSuccessEmail;
            case TRANSACTION_FAILED -> channel == Notification.Channel.IN_APP
                ? txFailedInApp : txFailedEmail;
            case ACCOUNT_UPDATE -> channel == Notification.Channel.IN_APP
                ? accountUpdateInApp : accountUpdateEmail;
            case SYSTEM_MESSAGE -> channel == Notification.Channel.IN_APP
                ? systemMessageInApp : systemMessageEmail;
            default -> true;
        };

        if (!channelAllowed) {
            return false;
        }

        // Quiet hours suppression (UTC): suppress non-critical notifications
        if (!quietHoursEnabled) {
            return true;
        }

        int nowHour = java.time.ZonedDateTime.now(java.time.ZoneOffset.UTC).getHour();
        int start = quietHoursStart;
        int end = quietHoursEnd;

        boolean inQuietHours = (start < end)
            ? (nowHour >= start && nowHour < end)
            : (nowHour >= start || nowHour < end); // wraps midnight

        if (!inQuietHours) {
            return true;
        }

        // Treat these as critical and allow during quiet hours
        boolean critical = type == Notification.NotificationType.SYSTEM_MESSAGE ||
            type == Notification.NotificationType.ACCOUNT_UPDATE;

        return critical;
    }

    public static NotificationPreference defaultsFor(User user) {
        NotificationPreference prefs = new NotificationPreference();
        prefs.user = user;
        return prefs;
    }
}

