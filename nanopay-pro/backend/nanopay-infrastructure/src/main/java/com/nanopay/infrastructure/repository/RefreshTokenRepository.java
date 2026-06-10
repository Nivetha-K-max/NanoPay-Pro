package com.nanopay.infrastructure.repository;

import com.nanopay.core.domain.entity.RefreshToken;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    List<RefreshToken> findByUserIdAndRevokedFalse(Long userId);

    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = TRUE, rt.revokedAt = :now, rt.revokeReason = :reason WHERE rt.user.id = :userId AND rt.revoked = FALSE")
    int revokeAllForUser(@Param("userId") Long userId,
                         @Param("now") Instant now,
                         @Param("reason") String reason);

    // Cleanup job: delete expired + revoked tokens older than 30 days
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :cutoff AND rt.revoked = TRUE")
    int deleteExpiredAndRevoked(@Param("cutoff") Instant cutoff);
}
