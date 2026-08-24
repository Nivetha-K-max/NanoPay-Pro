package com.nanopay.core.fraud.rules;

import com.nanopay.core.domain.entity.FraudFlag;
import com.nanopay.core.domain.entity.Transaction;
import com.nanopay.core.domain.entity.Wallet;
import com.nanopay.core.fraud.FraudRule;
import com.nanopay.core.fraud.RuleResult;
import com.nanopay.core.repository.FraudFlagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Rule 5: Prior fraud history on this account.
 * Score grows with each unresolved flag; auto-blocks at threshold.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FraudHistoryRule implements FraudRule {

    private final FraudFlagRepository fraudFlagRepository;

    @Value("${app.fraud.max-fraud-flags-before-block}")
    private int maxFlagsBeforeBlock;

    @Override
    public RuleResult evaluate(Transaction transaction, Wallet senderWallet) {
        if (transaction == null || senderWallet == null) return RuleResult.clean();

        Long userId = senderWallet.getUser().getId();
        long openFlags = fraudFlagRepository.countActiveFlags(userId);

        if (openFlags == 0) return RuleResult.clean();

        BigDecimal score = BigDecimal.valueOf(Math.min(openFlags * 15L, 45L));
        boolean blockImmediately = openFlags >= maxFlagsBeforeBlock;
        FraudFlag.Severity severity = openFlags >= maxFlagsBeforeBlock
            ? FraudFlag.Severity.CRITICAL
            : openFlags >= 2 ? FraudFlag.Severity.HIGH : FraudFlag.Severity.MEDIUM;

        return RuleResult.builder()
                .score(score)
                .blockImmediately(blockImmediately)
                .reason(String.format(
                    "Account has %d unresolved fraud flag(s)%s",
                    openFlags,
                    blockImmediately ? " — auto-block threshold reached" : ""))
                .flagType(FraudFlag.FlagType.PATTERN_MATCH)
                .severity(severity)
                .details(Map.of(
                    "openFlagCount", openFlags,
                    "blockThreshold", maxFlagsBeforeBlock,
                    "blockImmediately", blockImmediately,
                    "rule", getRuleName()
                ))
                .build();
    }

    @Override public String getRuleName() { return "FRAUD_HISTORY"; }
    @Override public int getPriority()    { return 5; }
}
