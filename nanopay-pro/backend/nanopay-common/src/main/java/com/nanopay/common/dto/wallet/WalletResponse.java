package com.nanopay.common.dto.wallet;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class WalletResponse {
    private Long id;
    private BigDecimal balance;
    private String currency;
    private String status;
    private BigDecimal dailySpent;
    private BigDecimal dailyLimit;
    private BigDecimal dailyRemaining;  // computed: dailyLimit - dailySpent
    private Instant updatedAt;
}
