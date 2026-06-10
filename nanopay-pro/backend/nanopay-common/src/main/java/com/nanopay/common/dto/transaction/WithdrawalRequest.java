package com.nanopay.common.dto.transaction;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class WithdrawalRequest {

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Minimum withdrawal is 0.01")
    @DecimalMax(value = "50000.00", message = "Maximum single withdrawal is 50,000")
    @Digits(integer = 15, fraction = 4, message = "Invalid amount format")
    private BigDecimal amount;

    @NotBlank(message = "Currency is required")
    @Size(min = 3, max = 3)
    private String currency = "USD";

    @Size(max = 500)
    private String description;

    @NotBlank(message = "Idempotency key is required")
    @Size(min = 16, max = 255)
    private String idempotencyKey;

    // In production this would reference a verified bank account record.
    // Simplified here — the destination account ID from the user's saved accounts.
    @NotBlank(message = "Destination account reference is required")
    private String destinationReference;
}
