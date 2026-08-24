package com.nanopay.core.repository;

import com.nanopay.core.domain.entity.Wallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WalletRepository extends JpaRepository<Wallet, Long> {

    Optional<Wallet> findByUserId(Long userId);

    Optional<Wallet> findByUserIdAndCurrency(Long userId, String currency);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Wallet w WHERE w.id = :id")
    Optional<Wallet> findByIdWithLock(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Wallet w WHERE w.user.id = :userId AND w.currency = :currency")
    Optional<Wallet> findByUserIdAndCurrencyWithLock(
            @Param("userId") Long userId,
            @Param("currency") String currency);

    @Query("SELECT w FROM Wallet w WHERE w.lastResetDate < CURRENT_DATE")
    List<Wallet> findWalletsNeedingDailyReset();
}
