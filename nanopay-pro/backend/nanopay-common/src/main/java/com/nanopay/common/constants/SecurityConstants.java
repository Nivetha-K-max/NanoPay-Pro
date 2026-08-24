package com.nanopay.common.constants;

public final class SecurityConstants {

    private SecurityConstants() {}

    public static final String TOKEN_PREFIX         = "Bearer ";
    public static final String HEADER_STRING        = "Authorization";
    public static final int    MAX_LOGIN_ATTEMPTS   = 5;
    public static final long   LOCK_DURATION_MINUTES = 30L;

    // Redis key prefixes
    public static final String REDIS_LOGIN_ATTEMPT_PREFIX  = "login:attempts:";
    public static final String REDIS_REFRESH_TOKEN_PREFIX  = "auth:refresh:";
    public static final String REDIS_IDEMPOTENCY_PREFIX    = "idempotency:";
    public static final String REDIS_RATE_LIMIT_PREFIX     = "rate:limit:";
    public static final String REDIS_SESSION_PREFIX        = "session:";
}
