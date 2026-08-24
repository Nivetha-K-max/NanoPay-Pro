package com.nanopay.common.dto.transaction;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
public class TransactionResponse {

    private Long id;
    private String referenceNumber;
    private String type;
    private String status;

    // Wallet summaries — never expose full wallet objects
    private WalletSummary senderWallet;
    private WalletSummary receiverWallet;

    private BigDecimal amount;
    private String currency;
    private BigDecimal fee;
    private BigDecimal netAmount;
    private String description;
    private BigDecimal fraudScore;
    private Instant createdAt;
    private Instant completedAt;

    private List<LogEntry> logs;

    @Data
    @Builder
    public static class WalletSummary {
        private Long walletId;
        private String ownerName;
        // Security: never expose balance in transaction response —
        // a recipient shouldn't see the sender's balance
    }

    @Data
    @Builder
    public static class LogEntry {
        private String fromStatus;
        private String toStatus;
        private String reason;
        private Instant timestamp;
    }
}
