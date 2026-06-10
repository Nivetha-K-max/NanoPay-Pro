package com.nanopay.core.repository;

import com.nanopay.core.domain.entity.FraudFlag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FraudFlagRepository extends JpaRepository<FraudFlag, Long> {

    long countByUserIdAndStatus(Long userId, FraudFlag.FlagStatus status);

    List<FraudFlag> findByTransactionId(Long transactionId);

    Page<FraudFlag> findByStatus(FraudFlag.FlagStatus status, Pageable pageable);

    Page<FraudFlag> findByStatusAndSeverity(FraudFlag.FlagStatus status,
                                             FraudFlag.Severity severity,
                                             Pageable pageable);

    @Query("""
        SELECT COUNT(f) FROM FraudFlag f
        WHERE f.user.id = :userId
        AND f.status IN ('OPEN', 'UNDER_REVIEW')
        """)
    long countActiveFlags(@Param("userId") Long userId);
}
