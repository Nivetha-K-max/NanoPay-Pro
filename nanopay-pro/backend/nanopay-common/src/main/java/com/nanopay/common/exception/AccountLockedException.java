package com.nanopay.common.exception;

import org.springframework.http.HttpStatus;

public class AccountLockedException extends NanoPayException {

    public AccountLockedException() {
        super("Account is locked due to too many failed login attempts. "
              + "Please contact support or wait 30 minutes.",
              HttpStatus.LOCKED,
              "ACCOUNT_LOCKED");
    }
}
