package com.nanopay.common.exception;

import org.springframework.http.HttpStatus;

public class InsufficientFundsException extends NanoPayException {

    public InsufficientFundsException() {
        super("Insufficient wallet balance for this transaction",
              HttpStatus.UNPROCESSABLE_ENTITY,
              "INSUFFICIENT_FUNDS");
    }
}
