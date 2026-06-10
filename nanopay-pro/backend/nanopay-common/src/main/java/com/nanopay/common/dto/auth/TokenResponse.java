package com.nanopay.common.dto.auth;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TokenResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType;           // always "Bearer"
    private long accessTokenExpiresIn;  // seconds
    private UserSummary user;

    @Data
    @Builder
    public static class UserSummary {
        private Long id;
        private String email;
        private String firstName;
        private String lastName;
        private String role;
    }
}
