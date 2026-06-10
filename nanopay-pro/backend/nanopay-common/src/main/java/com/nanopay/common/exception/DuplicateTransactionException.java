package com.nanopay.common.exception;

import org.springframework.http.HttpStatus;

public class DuplicateTransactionException extends NanoPayException {

    public DuplicateTransactionException(String idempotencyKey) {
        super(
            String.format("Transaction with idempotency key '%s' already processed", idempotencyKey),
            HttpStatus.CONFLICT,
            "DUPLICATE_TRANSACTION"
        );
    }
}
