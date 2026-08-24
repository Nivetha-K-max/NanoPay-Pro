package com.nanopay.core.repository;

import com.nanopay.core.domain.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    boolean existsByIdempotencyKey(String idempotencyKey);

    Optional<Transaction> findByIdempotencyKey(String idempotencyKey);

    Optional<Transaction> findByReferenceNumber(String referenceNumber);

    @Query("""
        SELECT COUNT(t) FROM Transaction t
        WHERE t.senderWallet.id = :walletId
        AND t.createdAt >= :since
        AND t.status NOT IN ('FAILED', 'REVERSED')
        """)
    long countByWalletIdSince(@Param("walletId") Long walletId, @Param("since") Instant since);

    @Query("""
        SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t
        WHERE t.senderWallet.id = :walletId
        AND t.createdAt >= :since
        AND t.status NOT IN ('FAILED', 'REVERSED')
        """)
    BigDecimal sumAmountByWalletIdSince(@Param("walletId") Long walletId, @Param("since") Instant since);

    @Query("""
        SELECT t FROM Transaction t
        WHERE (t.senderWallet.id = :walletId OR t.receiverWallet.id = :walletId)
        AND t.createdAt BETWEEN :from AND :to
        ORDER BY t.createdAt DESC
        """)
    Page<Transaction> findByWalletIdAndDateRange(@Param("walletId") Long walletId,
                                                  @Param("from") Instant from,
                                                  @Param("to") Instant to,
                                                  Pageable pageable);

    @Query("""
        SELECT t.ipAddress FROM Transaction t
        WHERE t.senderWallet.id = :walletId
        AND t.createdAt >= :since
        AND t.ipAddress IS NOT NULL
        AND t.status != 'FAILED'
        ORDER BY t.createdAt DESC
        LIMIT 1
        """)
    Optional<String> findMostRecentIpForWallet(@Param("walletId") Long walletId,
                                               @Param("since") Instant since);

    @Query("""
        SELECT t FROM Transaction t
        WHERE t.fraudScore >= :minScore
        AND t.fraudChecked = TRUE
        ORDER BY t.fraudScore DESC, t.createdAt DESC
        """)
    Page<Transaction> findHighRiskTransactions(@Param("minScore") BigDecimal minScore,
                                               Pageable pageable);
}
