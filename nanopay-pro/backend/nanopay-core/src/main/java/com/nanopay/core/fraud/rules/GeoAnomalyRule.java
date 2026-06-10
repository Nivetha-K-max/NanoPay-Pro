package com.nanopay.core.fraud.rules;

import com.nanopay.core.domain.entity.FraudFlag;
import com.nanopay.core.domain.entity.Transaction;
import com.nanopay.core.domain.entity.Wallet;
import com.nanopay.core.fraud.FraudRule;
import com.nanopay.core.fraud.RuleResult;
import com.nanopay.core.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Rule 4: Geographic anomaly detection.
 * Checks for Tor/proxy usage and impossible travel between transactions.
 * Production: replace getCountryFromIp() with MaxMind GeoLite2 lookup.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GeoAnomalyRule implements FraudRule {

    private final TransactionRepository transactionRepository;

    private static final List<String> HIGH_RISK_COUNTRIES = List.of("KP", "IR", "SY", "CU", "VE");
    private static final List<String> SUSPICIOUS_IP_PREFIXES = List.of(
        "185.220.", "199.249.", "199.87.", "162.247."
    );
    private static final int TRAVEL_WINDOW_MINUTES = 60;

    @Override
    public RuleResult evaluate(Transaction transaction, Wallet senderWallet) {
        if (transaction == null || senderWallet == null || transaction.getIpAddress() == null) {
            return RuleResult.clean();
        }

        RuleResult proxyResult = checkProxyOrTor(transaction.getIpAddress());
        if (proxyResult.isTriggered()) return proxyResult;

        return checkImpossibleTravel(transaction, senderWallet);
    }

    private RuleResult checkProxyOrTor(String ip) {
        for (String prefix : SUSPICIOUS_IP_PREFIXES) {
            if (ip.startsWith(prefix)) {
                return RuleResult.builder()
                        .score(new BigDecimal("30"))
                        .blockImmediately(false)
                        .reason("Transaction originated from known anonymization network")
                        .flagType(FraudFlag.FlagType.GEO_ANOMALY)
                        .severity(FraudFlag.Severity.HIGH)
                        .details(Map.of("currentIp", maskIp(ip), "detection", "TOR_OR_PROXY",
                                        "rule", getRuleName()))
                        .build();
            }
        }
        return RuleResult.clean();
    }

    private RuleResult checkImpossibleTravel(Transaction transaction, Wallet senderWallet) {
        String currentIp = transaction.getIpAddress();
        Instant windowStart = Instant.now().minus(TRAVEL_WINDOW_MINUTES, ChronoUnit.MINUTES);

        Optional<String> recentIp = transactionRepository
            .findMostRecentIpForWallet(senderWallet.getId(), windowStart);

        if (recentIp.isEmpty() || recentIp.get().equals(currentIp)) {
            return RuleResult.clean();
        }

        String previousIp      = recentIp.get();
        String currentCountry  = getCountryFromIp(currentIp);
        String previousCountry = getCountryFromIp(previousIp);

        if (!currentCountry.equals("UNKNOWN") && !previousCountry.equals("UNKNOWN")
                && !currentCountry.equals(previousCountry)) {
            return buildTravelResult(currentIp, previousIp, currentCountry, previousCountry);
        }

        if (HIGH_RISK_COUNTRIES.contains(currentCountry)) {
            return RuleResult.builder()
                    .score(new BigDecimal("35"))
                    .blockImmediately(false)
                    .reason("Transaction from high-risk country: " + currentCountry)
                    .flagType(FraudFlag.FlagType.GEO_ANOMALY)
                    .severity(FraudFlag.Severity.HIGH)
                    .details(Map.of("currentIp", maskIp(currentIp),
                                    "currentCountry", currentCountry,
                                    "rule", getRuleName()))
                    .build();
        }

        return RuleResult.clean();
    }

    private RuleResult buildTravelResult(String currentIp, String previousIp,
                                          String currentCountry, String previousCountry) {
        boolean highRisk = HIGH_RISK_COUNTRIES.contains(currentCountry);
        return RuleResult.builder()
                .score(highRisk ? new BigDecimal("45") : new BigDecimal("30"))
                .blockImmediately(false)
                .reason(String.format(
                    "Geographic anomaly: previous transaction from %s, current from %s within %d minutes",
                    previousCountry, currentCountry, TRAVEL_WINDOW_MINUTES))
                .flagType(FraudFlag.FlagType.GEO_ANOMALY)
                .severity(highRisk ? FraudFlag.Severity.CRITICAL : FraudFlag.Severity.HIGH)
                .details(Map.of(
                    "currentIp", maskIp(currentIp),
                    "previousIp", maskIp(previousIp),
                    "currentCountry", currentCountry,
                    "previousCountry", previousCountry,
                    "windowMinutes", TRAVEL_WINDOW_MINUTES,
                    "rule", getRuleName()
                ))
                .build();
    }

    /** Production: replace with MaxMind GeoLite2 database lookup. */
    private String getCountryFromIp(String ip) {
        if (ip == null || ip.isBlank()) return "UNKNOWN";
        if (ip.startsWith("127.") || ip.startsWith("192.168.")
                || ip.startsWith("10.") || ip.equals("0:0:0:0:0:0:0:1")) {
            return "LOCAL";
        }
        return "UNKNOWN";
    }

    /** Masks last octet to avoid storing full IP in fraud details. */
    private String maskIp(String ip) {
        if (ip == null) return "UNKNOWN";
        int lastDot = ip.lastIndexOf('.');
        if (lastDot < 0) return ip.substring(0, Math.min(ip.length(), 8)) + "***";
        return ip.substring(0, lastDot) + ".***";
    }

    @Override public String getRuleName() { return "GEO_ANOMALY"; }
    @Override public int getPriority()    { return 4; }
}
