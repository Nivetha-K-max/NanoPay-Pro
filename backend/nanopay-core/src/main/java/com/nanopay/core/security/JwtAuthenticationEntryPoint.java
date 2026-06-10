package com.nanopay.core.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nanopay.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Called by Spring Security when an unauthenticated request hits a protected endpoint.
 * Returns a consistent JSON 401, not a redirect to a login page (this is a REST API).
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException) throws IOException {

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        // Security: never echo back the authException.getMessage() —
        // it can leak internal state (e.g., "User not found" vs "Bad credentials")
        objectMapper.writeValue(
            response.getOutputStream(),
            ApiResponse.error("Authentication required")
        );
    }
}
