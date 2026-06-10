package com.nanopay.core.security;

import com.nanopay.common.constants.SecurityConstants;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory Bucket4j rate limiter for auth endpoints.
 * Production note: for multi-instance deployments, use bucket4j-redis
 * so limits are shared across all pods. For this implementation,
 * in-memory is used per-instance; the account lockout in the DB
 * handles the distributed enforcement for login attempts specifically.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RateLimiterService {

    private final RedisTemplate<String, String> redisTemplate;

    // Cache of IP -> Bucket for auth rate limiting
    private final Map<String, Bucket> authBuckets = new ConcurrentHashMap<>();

    // Cache of IP -> Bucket for general API rate limiting
    private final Map<String, Bucket> apiBuckets = new ConcurrentHashMap<>();

    @Value("${app.rate-limit.login-attempts}")
    private int loginAttempts;

    @Value("${app.rate-limit.login-window-seconds}")
    private int loginWindowSeconds;

    @Value("${app.rate-limit.api-requests-per-minute}")
    private int apiRequestsPerMinute;

    /**
     * Auth endpoint rate limiting: 5 attempts per minute per IP.
     * This is separate from account lockout — rate limiting is at the
     * network layer, lockout is at the account layer. Both are needed.
     */
    public boolean tryConsumeAuthRequest(String ipAddress) {
        Bucket bucket = authBuckets.computeIfAbsent(ipAddress,
            ip -> Bucket.builder()
                .addLimit(Bandwidth.builder()
                    .capacity(loginAttempts)
                    .refillIntervally(loginAttempts, Duration.ofSeconds(loginWindowSeconds))
                    .build())
                .build());
        return bucket.tryConsume(1);
    }

    /**
     * General API rate limiting: 100 requests per minute per IP.
     */
    public boolean tryConsumeApiRequest(String ipAddress) {
        Bucket bucket = apiBuckets.computeIfAbsent(ipAddress,
            ip -> Bucket.builder()
                .addLimit(Bandwidth.builder()
                    .capacity(apiRequestsPerMinute)
                    .refillIntervally(apiRequestsPerMinute, Duration.ofMinutes(1))
                    .build())
                .build());
        return bucket.tryConsume(1);
    }

    public long getAvailableAuthTokens(String ipAddress) {
        Bucket bucket = authBuckets.get(ipAddress);
        return bucket != null ? bucket.getAvailableTokens() : loginAttempts;
    }
}
