package com.nanopay.core.fraud.rules;

import com.nanopay.core.domain.entity.FraudFlag;
import com.nanopay.core.domain.entity.Transaction;
import com.nanopay.core.domain.entity.Wallet;
import com.nanopay.core.fraud.FraudRule;
import com.nanopay.core.fraud.RuleResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

/**
 * Rule 1: Single transaction amount checks.
 * - Amount exceeds absolute limit → immediate block
 * - Structuring pattern (just under BSA reporting thresholds)
 * - Amount >= 80% of limit → high-value flag
 */
@Slf4j
@Component
public class AmountLimitRule implements FraudRule {

    @Value("${app.fraud.single-transaction-limit}")
    private BigDecimal singleTransactionLimit;

    private static final BigDecimal[] STRUCTURING_AMOUNTS = {
        new BigDecimal("9999.00"), new BigDecimal("9900.00"), new BigDecimal("9000.00"),
        new BigDecimal("4999.00"), new BigDecimal("4900.00")
    };

    @Override
    public RuleResult evaluate(Transaction transaction, Wallet senderWallet) {
        if (transaction == null) return RuleResult.clean();

        BigDecimal amount = transaction.getAmount();

        if (amount.compareTo(singleTransactionLimit) > 0) {
            return RuleResult.builder()
                    .score(new BigDecimal("50"))
                    .blockImmediately(true)
                    .reason("Amount exceeds single transaction limit of " + singleTransactionLimit)
                    .flagType(FraudFlag.FlagType.AMOUNT_LIMIT)
                    .severity(FraudFlag.Severity.CRITICAL)
                    .details(Map.of("amount", amount, "limit", singleTransactionLimit,
                                    "rule", getRuleName(), "action", "BLOCKED"))
                    .build();
        }

        for (BigDecimal threshold : STRUCTURING_AMOUNTS) {
            if (amount.compareTo(threshold) == 0) {
                return RuleResult.builder()
                        .score(new BigDecimal("40"))
                        .blockImmediately(false)
                        .reason("Structuring pattern detected: amount matches known " +
                                "reporting threshold avoidance amount")
                        .flagType(FraudFlag.FlagType.AMOUNT_LIMIT)
                        .severity(FraudFlag.Severity.HIGH)
                        .details(Map.of("amount", amount, "pattern", "STRUCTURING",
                                        "rule", getRuleName()))
                        .build();
            }
        }

        BigDecimal ratio = amount.divide(singleTransactionLimit, 4, RoundingMode.HALF_UP);
        if (ratio.compareTo(new BigDecimal("0.80")) >= 0) {
            BigDecimal score = ratio.multiply(new BigDecimal("25")).setScale(2, RoundingMode.HALF_UP);
            return RuleResult.builder()
                    .score(score)
                    .blockImmediately(false)
                    .reason("High-value transaction: " +
                            ratio.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP)
                            + "% of single transaction limit")
                    .flagType(FraudFlag.FlagType.AMOUNT_LIMIT)
                    .severity(FraudFlag.Severity.MEDIUM)
                    .details(Map.of("amount", amount, "limit", singleTransactionLimit,
                                    "percentOfLimit", ratio.multiply(BigDecimal.valueOf(100)),
                                    "rule", getRuleName()))
                    .build();
        }

        return RuleResult.clean();
    }

    @Override public String getRuleName() { return "AMOUNT_LIMIT"; }
    @Override public int getPriority()    { return 1; }
}
