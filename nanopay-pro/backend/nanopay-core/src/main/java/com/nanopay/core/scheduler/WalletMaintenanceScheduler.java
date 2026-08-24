package com.nanopay.core.scheduler;

import com.nanopay.core.domain.entity.Wallet;
import com.nanopay.core.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class WalletMaintenanceScheduler {

    private final WalletRepository walletRepository;

    @Scheduled(cron = "0 0 0 * * *", zone = "UTC")
    @Transactional
    public void resetDailySpendLimits() {
        List<Wallet> staleWallets = walletRepository.findWalletsNeedingDailyReset();
        staleWallets.forEach(Wallet::resetDailySpend);
        walletRepository.saveAll(staleWallets);
        log.info("Daily spend limits reset for {} wallets", staleWallets.size());
    }
}

