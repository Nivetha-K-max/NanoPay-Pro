package com.nanopay.core.scheduler;

import com.nanopay.core.repository.RefreshTokenRepository;
import com.nanopay.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import com.nanopay.core.domain.entity.User;

/**
 * Background jobs that keep auth state clean.
 * Runs on a schedule — not in the request path.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AuthMaintenanceScheduler {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    /**
     * Unlock accounts whose lockout period has expired.
     * Runs every 5 minutes — within ~5 min of the lockout expiry, users can log in again.
     */
    @Scheduled(fixedRate = 300_000)
    @Transactional
    public void unlockExpiredLocks() {
        List<User> expiredLocks = userRepository.findExpiredLocks(Instant.now());
        expiredLocks.forEach(user -> {
            user.resetFailedAttempts();
            user.setStatus(User.UserStatus.ACTIVE);
            log.info("Auto-unlocked account: userId={}", user.getId());
        });
        if (!expiredLocks.isEmpty()) {
            userRepository.saveAll(expiredLocks);
        }
    }

    /**
     * Delete refresh tokens that are expired AND revoked, older than 30 days.
     * Runs daily at 2 AM UTC. Keeps the table from growing unboundedly.
     */
    @Scheduled(cron = "0 0 2 * * *", zone = "UTC")
    @Transactional
    public void purgeExpiredRefreshTokens() {
        Instant cutoff = Instant.now().minus(30, ChronoUnit.DAYS);
        int deleted = refreshTokenRepository.deleteExpiredAndRevoked(cutoff);
        log.info("Purged {} expired refresh tokens", deleted);
    }
}
