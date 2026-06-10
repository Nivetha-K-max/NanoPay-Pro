package com.nanopay.common.dto.transaction;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class DepositRequest {

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Minimum deposit is 0.01")
    @DecimalMax(value = "100000.00", message = "Maximum single deposit is 100,000")
    @Digits(integer = 15, fraction = 4, message = "Invalid amount format")
    private BigDecimal amount;

    @NotBlank(message = "Currency is required")
    @Size(min = 3, max = 3, message = "Currency must be a 3-letter ISO code")
    private String currency = "USD";

    @Size(max = 500, message = "Description too long")
    private String description;

    /**
     * Client-generated UUID for idempotency.
     * If the same key is submitted twice, the second request returns the
     * first transaction's result without processing it again.
     * Clients MUST generate a new key for each distinct transaction attempt.
     */
    @NotBlank(message = "Idempotency key is required")
    @Size(min = 16, max = 255, message = "Idempotency key must be between 16 and 255 characters")
    private String idempotencyKey;
}
