package com.nanopay.core.security;

import com.nanopay.common.constants.SecurityConstants;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Runs once per request, before Spring Security's own auth processing.
 * If a valid JWT is present, sets the Authentication in SecurityContext
 * so that @PreAuthorize and role checks work downstream.
 *
 * Security: this filter ONLY authenticates — it never throws 401/403 directly.
 * If no valid token is found, the SecurityContext is simply left empty, and
 * Spring Security's AuthenticationEntryPoint handles the 401 response.
 * This separation of concerns prevents inconsistent error responses.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String token = extractToken(request);

        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
            String email = jwtTokenProvider.getEmailFromToken(token);

            // Load user from DB to validate account is still active/non-locked.
            // This adds one DB query per request — acceptable for a fintech app
            // where we need real-time account status.
            // Optimization option: cache UserDetails in Redis with a short TTL.
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);

            if (userDetails.isEnabled() && userDetails.isAccountNonLocked()) {
                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());

                authentication.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
                log.debug("Authenticated user: {}", email);
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extracts the Bearer token from the Authorization header.
     * Returns null rather than throwing — missing token is not an error here.
     */
    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader(SecurityConstants.HEADER_STRING);
        if (StringUtils.hasText(header) && header.startsWith(SecurityConstants.TOKEN_PREFIX)) {
            return header.substring(SecurityConstants.TOKEN_PREFIX.length());
        }
        return null;
    }

    /**
     * Skip JWT processing for public endpoints entirely —
     * avoids unnecessary DB lookups for login/register/health.
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.startsWith("/api/v1/auth/")
            || path.startsWith("/actuator/health")
            || path.startsWith("/v3/api-docs")
            || path.startsWith("/swagger-ui");
    }
}
