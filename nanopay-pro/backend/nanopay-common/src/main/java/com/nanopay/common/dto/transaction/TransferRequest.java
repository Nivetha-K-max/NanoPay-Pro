package com.nanopay.common.dto.transaction;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TransferRequest {

    @NotNull(message = "Recipient is required")
    private String recipientEmail;  // we look up wallet by email

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Minimum transfer is 0.01")
    @DecimalMax(value = "25000.00", message = "Maximum single transfer is 25,000")
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
}
