package com.nanopay.common.dto.fraud;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

@Data
@Builder
public class FraudFlagResponse {

    private Long   id;
    private Long   transactionId;
    private String referenceNumber;
    private Long   userId;
    private String userEmail;
    private String flagType;
    private String severity;
    private BigDecimal fraudScore;
    private Map<String, Object> details;
    private String status;
    private String reviewedByEmail;
    private Instant reviewedAt;
    private String reviewNotes;
    private Instant createdAt;

    private BigDecimal transactionAmount;
    private String     transactionCurrency;
    private String     transactionType;
    private String     transactionStatus;
}
