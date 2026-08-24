package com.nanopay.infrastructure.repository;

import com.nanopay.core.domain.entity.FraudFlag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FraudFlagRepository extends JpaRepository<FraudFlag, Long> {

    long countByUserIdAndStatus(Long userId, FraudFlag.FlagStatus status);

    List<FraudFlag> findByTransactionId(Long transactionId);

    Page<FraudFlag> findByStatus(FraudFlag.FlagStatus status, Pageable pageable);

    Page<FraudFlag> findByStatusAndSeverity(
            FraudFlag.FlagStatus status,
            FraudFlag.Severity severity,
            Pageable pageable);

    // Auto-block check: count open + under-review flags for a user
    @Query("""
        SELECT COUNT(f) FROM FraudFlag f
        WHERE f.user.id = :userId
        AND f.status IN ('OPEN', 'UNDER_REVIEW')
        """)
    long countActiveFlags(@Param("userId") Long userId);
}
