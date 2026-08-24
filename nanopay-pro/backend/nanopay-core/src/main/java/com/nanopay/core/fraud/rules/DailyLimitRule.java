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
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class DailyLimitRule implements FraudRule {

    private final TransactionRepository transactionRepository;

    @Value("${app.fraud.daily-limit}")
    private BigDecimal configuredDailyLimit;

    @Override
    public RuleResult evaluate(Transaction transaction, Wallet senderWallet) {
        if (transaction == null || senderWallet == null) return RuleResult.clean();

        BigDecimal effectiveLimit = configuredDailyLimit.min(senderWallet.getDailyLimit());

        Instant dayStart = Instant.now().truncatedTo(ChronoUnit.DAYS);
        BigDecimal todaySpent = transactionRepository.sumAmountByWalletIdSince(
            senderWallet.getId(), dayStart);

        BigDecimal projectedTotal = todaySpent.add(transaction.getAmount());
        BigDecimal utilization = projectedTotal.divide(effectiveLimit, 4, RoundingMode.HALF_UP);

        if (projectedTotal.compareTo(effectiveLimit) > 0) {
            return RuleResult.builder()
                    .score(new BigDecimal("35"))
                    .blockImmediately(false)
                    .reason(String.format(
                        "Daily limit exceeded: projected total %s exceeds limit %s",
                        projectedTotal, effectiveLimit))
                    .flagType(FraudFlag.FlagType.AMOUNT_LIMIT)
                    .severity(FraudFlag.Severity.HIGH)
                    .details(Map.of(
                        "todaySpent", todaySpent,
                        "thisTransaction", transaction.getAmount(),
                        "projectedTotal", projectedTotal,
                        "dailyLimit", effectiveLimit,
                        "rule", getRuleName()
                    ))
                    .build();
        }

        if (utilization.compareTo(new BigDecimal("0.80")) >= 0) {
            return RuleResult.builder()
                    .score(new BigDecimal("15"))
                    .blockImmediately(false)
                    .reason(String.format(
                        "High daily utilization: %.0f%% of daily limit used",
                        utilization.doubleValue() * 100))
                    .flagType(FraudFlag.FlagType.AMOUNT_LIMIT)
                    .severity(FraudFlag.Severity.LOW)
                    .details(Map.of(
                        "todaySpent", todaySpent,
                        "dailyLimit", effectiveLimit,
                        "utilization", utilization,
                        "rule", getRuleName()
                    ))
                    .build();
        }

        return RuleResult.clean();
    }

    @Override public String getRuleName() { return "DAILY_LIMIT"; }
    @Override public int getPriority()    { return 3; }
}
