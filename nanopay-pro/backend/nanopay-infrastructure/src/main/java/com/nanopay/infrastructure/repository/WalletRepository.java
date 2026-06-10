package com.nanopay.infrastructure.repository;

import com.nanopay.core.domain.entity.Wallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WalletRepository extends JpaRepository<Wallet, Long> {

    Optional<Wallet> findByUserId(Long userId);

    Optional<Wallet> findByUserIdAndCurrency(Long userId, String currency);

    /**
     * PESSIMISTIC_WRITE issues SELECT ... FOR UPDATE.
     * This is the critical lock that prevents double-spend:
     * only one transaction at a time can hold this lock on a wallet row.
     * All concurrent debits for the same wallet serialize through this lock.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Wallet w WHERE w.id = :id")
    Optional<Wallet> findByIdWithLock(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Wallet w WHERE w.user.id = :userId AND w.currency = :currency")
    Optional<Wallet> findByUserIdAndCurrencyWithLock(
            @Param("userId") Long userId,
            @Param("currency") String currency);

    // Used by daily limit reset scheduler
    @Query("SELECT w FROM Wallet w WHERE w.lastResetDate < CURRENT_DATE")
    List<Wallet> findWalletsNeedingDailyReset();
}
