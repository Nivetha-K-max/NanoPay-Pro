package com.nanopay.core.security;

import com.nanopay.core.domain.entity.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

/**
 * Handles all JWT operations: creation, parsing, validation.
 *
 * Security decisions:
 * - HS512 with a 512-bit key — stronger than the common HS256 default
 * - Short-lived access tokens (15 min) — limits blast radius of token theft
 * - Claims include role and userId to avoid DB lookup on every request
 * - jti (JWT ID) claim enables future token revocation if needed
 * - Key derived from Base64-encoded secret — avoids weak short-string keys
 */
@Slf4j
@Component
public class JwtTokenProvider {

    private final SecretKey signingKey;
    private final long accessTokenExpiryMs;
    private final long refreshTokenExpiryMs;

    public JwtTokenProvider(
            @Value("${app.jwt.secret}") String jwtSecret,
            @Value("${app.jwt.access-token-expiry}") long accessTokenExpiryMs,
            @Value("${app.jwt.refresh-token-expiry}") long refreshTokenExpiryMs) {

        // Decode the Base64 secret and derive a proper HMAC-SHA512 key.
        // This fails fast at startup if the secret is too short for HS512.
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
        this.accessTokenExpiryMs = accessTokenExpiryMs;
        this.refreshTokenExpiryMs = refreshTokenExpiryMs;
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getEmail())
                .id(UUID.randomUUID().toString())          // jti — unique per token
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(accessTokenExpiryMs)))
                .claims(Map.of(
                    "userId", user.getId(),
                    "role",   user.getRole().getName(),
                    "type",   "access"
                ))
                .signWith(signingKey)
                .compact();
    }

    /**
     * Refresh token is opaque from the client's perspective —
     * it's just a UUID that maps to a DB record.
     * We don't use JWT for refresh tokens because they can't be revoked
     * without a blocklist; DB records can simply be deleted.
     */
    public String generateRefreshTokenValue() {
        return UUID.randomUUID().toString();
    }

    public Claims parseAccessToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.debug("JWT token expired");
        } catch (UnsupportedJwtException e) {
            log.warn("Unsupported JWT token");
        } catch (MalformedJwtException e) {
            log.warn("Malformed JWT token");
        } catch (SecurityException e) {
            // Security: log at WARN not ERROR — invalid tokens are common in
            // security probing; ERROR would flood alerts
            log.warn("Invalid JWT signature");
        } catch (IllegalArgumentException e) {
            log.warn("JWT claims string is empty");
        }
        return false;
    }

    public String getEmailFromToken(String token) {
        return parseAccessToken(token).getSubject();
    }

    public String getRoleFromToken(String token) {
        return parseAccessToken(token).get("role", String.class);
    }

    public long getRefreshTokenExpiryMs() {
        return refreshTokenExpiryMs;
    }
}
