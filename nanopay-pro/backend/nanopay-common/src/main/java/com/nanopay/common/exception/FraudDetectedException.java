package com.nanopay.common.exception;

import org.springframework.http.HttpStatus;

public class FraudDetectedException extends NanoPayException {

    public FraudDetectedException(String reason) {
        super("Transaction blocked by fraud detection: " + reason,
              HttpStatus.FORBIDDEN,
              "FRAUD_DETECTED");
    }
}
