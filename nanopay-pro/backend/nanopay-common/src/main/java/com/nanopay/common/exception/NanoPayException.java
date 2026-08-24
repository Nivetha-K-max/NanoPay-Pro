package com.nanopay.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Base runtime exception for all business-layer errors.
 * Carrying an HttpStatus here lets the global handler map it without
 * a giant if-else chain. Never throw raw RuntimeException in service code.
 */
@Getter
public class NanoPayException extends RuntimeException {

    private final HttpStatus status;
    private final String errorCode;

    public NanoPayException(String message, HttpStatus status, String errorCode) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

    public NanoPayException(String message, HttpStatus status) {
        this(message, status, status.name());
    }
}
