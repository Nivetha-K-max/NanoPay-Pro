package com.nanopay.core.service;

import com.nanopay.common.exception.FraudDetectedException;
import com.nanopay.core.domain.entity.*;
import com.nanopay.core.fraud.FraudRule;
import com.nanopay.core.fraud.RuleResult;
import com.nanopay.core.repository.FraudFlagRepository;
import com.nanopay.core.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * Fraud detection orchestrator using the FraudRule strategy pattern.
 * Rules are injected by Spring and sorted once at startup by priority.
 *
 * Score thresholds:
 * >= 75 → block + flag
 * >= 40 → flag for review, allow through
 *  < 40 → clean
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FraudDetectionService {

    private final List<FraudRule> fraudRules;
    private final FraudFlagRepository fraudFlagRepository;
    private final UserRepository userRepository;

    @Value("${app.fraud.max-fraud-flags-before-block}")
    private int maxFlagsBeforeBlock;

    // Sorted once at startup — rules are stateless and priority never changes
    private List<FraudRule> sortedRules;

    @PostConstruct
    void init() {
        sortedRules = fraudRules.stream()
            .sorted(Comparator.comparingInt(FraudRule::getPriority))
            .toList();
        log.info("Fraud rules loaded ({}): {}", sortedRules.size(),
            sortedRules.stream().map(FraudRule::getRuleName).toList());
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public BigDecimal evaluate(Transaction transaction, Wallet senderWallet) {
        BigDecimal totalScore = BigDecimal.ZERO;
        List<RuleResult> triggeredResults = new ArrayList<>();

        for (FraudRule rule : sortedRules) {
            RuleResult result = rule.evaluate(transaction, senderWallet);

            if (result.isTriggered()) {
                triggeredResults.add(result);
                totalScore = totalScore.add(result.getScore()).min(new BigDecimal("100.00"));

                log.debug("Fraud rule triggered: rule={}, score={}, totalScore={}, tx={}",
                    rule.getRuleName(), result.getScore(), totalScore, transaction.getId());

                if (result.isBlockImmediately()) {
                    persistFraudFlag(transaction, senderWallet, result, totalScore);
                    blockAccountIfNeeded(senderWallet);
                    throw new FraudDetectedException(result.getReason());
                }
            }
        }

        totalScore = totalScore.setScale(2, RoundingMode.HALF_UP);

        if (totalScore.compareTo(new BigDecimal("75")) >= 0) {
            RuleResult worst = worstResult(triggeredResults);
            persistFraudFlag(transaction, senderWallet, worst, totalScore);
            blockAccountIfNeeded(senderWallet);
            throw new FraudDetectedException("Transaction blocked: composite fraud score " + totalScore);
        }

        if (totalScore.compareTo(new BigDecimal("40")) >= 0 && !triggeredResults.isEmpty()) {
            persistFraudFlag(transaction, senderWallet, worstResult(triggeredResults), totalScore);
            log.warn("Transaction flagged for review: txId={}, score={}", transaction.getId(), totalScore);
        }

        return totalScore;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void persistFraudFlag(Transaction transaction, Wallet senderWallet,
                                  RuleResult result, BigDecimal compositeScore) {
        if (senderWallet == null) return;

        FraudFlag flag = new FraudFlag();
        flag.setTransaction(transaction);
        flag.setUser(senderWallet.getUser());
        flag.setFlagType(result.getFlagType());
        flag.setSeverity(result.getSeverity());
        flag.setFraudScore(compositeScore);
        flag.setStatus(FraudFlag.FlagStatus.OPEN);
        flag.setDetails(result.getDetails());
        fraudFlagRepository.save(flag);

        log.warn("FraudFlag persisted: userId={}, txId={}, type={}, severity={}, score={}",
            senderWallet.getUser().getId(), transaction.getId(),
            result.getFlagType(), result.getSeverity(), compositeScore);
    }

    private void blockAccountIfNeeded(Wallet senderWallet) {
        if (senderWallet == null) return;
        long activeFlags = fraudFlagRepository.countActiveFlags(senderWallet.getUser().getId());

        if (activeFlags >= maxFlagsBeforeBlock) {
            userRepository.findById(senderWallet.getUser().getId()).ifPresent(user -> {
                user.setStatus(User.UserStatus.SUSPENDED);
                userRepository.save(user);
                log.warn("Account auto-suspended: userId={}, activeFlags={}", user.getId(), activeFlags);
            });
        }
    }

    private RuleResult worstResult(List<RuleResult> results) {
        return results.stream()
            .max(Comparator.comparing(RuleResult::getScore))
            .orElse(RuleResult.clean());
    }
}
