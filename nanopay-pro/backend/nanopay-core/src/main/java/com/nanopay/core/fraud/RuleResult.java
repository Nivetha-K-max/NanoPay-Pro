package com.nanopay.core.fraud;

import com.nanopay.core.domain.entity.FraudFlag;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.Map;

@Getter
@Builder
public class RuleResult {

    private final BigDecimal score;
    private final boolean blockImmediately;
    private final String reason;
    private final Map<String, Object> details;
    private final FraudFlag.FlagType flagType;
    private final FraudFlag.Severity severity;

    public static RuleResult clean() {
        return RuleResult.builder()
                .score(BigDecimal.ZERO)
                .blockImmediately(false)
                .reason("Clean")
                .details(Map.of())
                .flagType(FraudFlag.FlagType.PATTERN_MATCH)
                .severity(FraudFlag.Severity.LOW)
                .build();
    }

    public boolean isTriggered() {
        return score.compareTo(BigDecimal.ZERO) > 0 || blockImmediately;
    }
}
