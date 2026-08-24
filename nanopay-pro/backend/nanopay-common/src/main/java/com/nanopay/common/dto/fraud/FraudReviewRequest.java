package com.nanopay.common.dto.fraud;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FraudReviewRequest {

    @NotNull(message = "Resolution is required")
    private Resolution resolution;

    @NotBlank(message = "Review notes are required")
    private String notes;

    public enum Resolution {
        RESOLVED_LEGITIMATE,
        RESOLVED_FRAUDULENT,
        DISMISSED
    }
}
