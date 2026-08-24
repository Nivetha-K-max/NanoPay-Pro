package com.nanopay.api.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nanopay.common.response.ApiResponse;
import com.nanopay.core.security.RateLimiterService;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Runs before the Spring Security filter chain (@Order(1) = very early).
 * Auth endpoints get a stricter bucket; all others get the general limit.
 * Returns 429 Too Many Requests with a Retry-After header.
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class RateLimitingFilter implements Filter {

    private final RateLimiterService rateLimiterService;
    private final ObjectMapper objectMapper;

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;

        String ipAddress = getClientIp(request);
        String path = request.getServletPath();

        boolean allowed;
        if (path.startsWith("/api/v1/auth/")) {
            allowed = rateLimiterService.tryConsumeAuthRequest(ipAddress);
        } else {
            allowed = rateLimiterService.tryConsumeApiRequest(ipAddress);
        }

        if (!allowed) {
            log.warn("Rate limit exceeded for IP: {}, path: {}", ipAddress, path);
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Retry-After", "60");
            objectMapper.writeValue(
                response.getOutputStream(),
                ApiResponse.error("Too many requests. Please slow down.")
            );
            return;
        }

        chain.doFilter(req, res);
    }

    /**
     * Extracts real client IP, respecting reverse proxy headers.
     * Security: only trust X-Forwarded-For if we know a trusted proxy is in front.
     * In production, validate that this header comes from your load balancer only.
     */
    private String getClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isEmpty()) {
            // X-Forwarded-For can be a comma-separated list; first IP is the client
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
