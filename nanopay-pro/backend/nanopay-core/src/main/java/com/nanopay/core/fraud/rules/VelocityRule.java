package com.nanopay.core.fraud.rules;

import com.nanopay.core.domain.entity.FraudFlag;
import com.nanopay.core.domain.entity.Transaction;
import com.nanopay.core.domain.entity.Wallet;
import com.nanopay.core.fraud.FraudRule;
import com.nanopay.core.fraud.RuleResult;
import com.nanopay.core.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

/**
 * Rule 2: Transaction velocity checks.
 * Checks count and volume in a rolling window.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class VelocityRule implements FraudRule {

    private final TransactionRepository transactionRepository;

    @Value("${app.fraud.velocity-window-minutes}")
    private int velocityWindowMinutes;

    @Value("${app.fraud.max-transactions-per-window}")
    private int maxTransactionsPerWindow;

    @Override
    public RuleResult evaluate(Transaction transaction, Wallet senderWallet) {
        if (transaction == null || senderWallet == null) return RuleResult.clean();

        Instant windowStart = Instant.now().minus(velocityWindowMinutes, ChronoUnit.MINUTES);

        long txCount = transactionRepository.countByWalletIdSince(
            senderWallet.getId(), windowStart);

        BigDecimal totalAmount = transactionRepository.sumAmountByWalletIdSince(
            senderWallet.getId(), windowStart);

        if (txCount >= maxTransactionsPerWindow) {
            return RuleResult.builder()
                    .score(new BigDecimal("45"))
                    .blockImmediately(true)
                    .reason(String.format(
                        "Velocity limit exceeded: %d transactions in %d minutes (limit: %d)",
                        txCount, velocityWindowMinutes, maxTransactionsPerWindow))
                    .flagType(FraudFlag.FlagType.VELOCITY_BREACH)
                    .severity(FraudFlag.Severity.CRITICAL)
                    .details(Map.of(
                        "txCountInWindow", txCount,
                        "maxAllowed", maxTransactionsPerWindow,
                        "windowMinutes", velocityWindowMinutes,
                        "totalAmountInWindow", totalAmount,
                        "rule", getRuleName(), "action", "BLOCKED"
                    ))
                    .build();
        }

        double utilizationRatio = (double) txCount / maxTransactionsPerWindow;
        if (utilizationRatio >= 0.75) {
            BigDecimal score = BigDecimal.valueOf(utilizationRatio * 20)
                                        .setScale(2, java.math.RoundingMode.HALF_UP);
            return RuleResult.builder()
                    .score(score)
                    .blockImmediately(false)
                    .reason(String.format(
                        "High velocity: %d/%d transactions in %d minutes",
                        txCount, maxTransactionsPerWindow, velocityWindowMinutes))
                    .flagType(FraudFlag.FlagType.VELOCITY_BREACH)
                    .severity(FraudFlag.Severity.MEDIUM)
                    .details(Map.of(
                        "txCountInWindow", txCount,
                        "maxAllowed", maxTransactionsPerWindow,
                        "windowMinutes", velocityWindowMinutes,
                        "rule", getRuleName()
                    ))
                    .build();
        }

        return RuleResult.clean();
    }

    @Override public String getRuleName() { return "VELOCITY"; }
    @Override public int getPriority()    { return 2; }
}
