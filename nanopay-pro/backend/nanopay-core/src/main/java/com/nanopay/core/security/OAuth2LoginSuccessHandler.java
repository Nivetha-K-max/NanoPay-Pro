package com.nanopay.core.security;

import com.nanopay.core.domain.entity.*;
import com.nanopay.core.repository.*;
import com.nanopay.core.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Handles successful Google OAuth2 login.
 * Creates account on first login (auto-provision), then issues JWT tokens
 * and redirects to the frontend with tokens in URL fragment.
 *
 * Security: tokens in URL fragment (#) are not sent to servers in Referer headers,
 * but they are visible in browser history. The frontend must extract them
 * immediately and remove them from the URL.
 * Alternative: set tokens in an HttpOnly cookie — preferred for higher security.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final WalletRepository walletRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuditService auditService;

    @Value("${app.cors.allowed-origins}")
    private String frontendUrl;

    @Override
    @Transactional
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException {

        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String email = oauth2User.getAttribute("email");
        String googleId = oauth2User.getAttribute("sub");    // Google's unique user ID
        String firstName = oauth2User.getAttribute("given_name");
        String lastName = oauth2User.getAttribute("family_name");
        String pictureUrl = oauth2User.getAttribute("picture");

        User user = userRepository
            .findByOauth2ProviderAndOauth2ProviderId("google", googleId)
            .orElseGet(() -> provisionOAuth2User(
                email, googleId, firstName, lastName, pictureUrl));

        if (user.getStatus() != User.UserStatus.ACTIVE) {
            log.warn("OAuth2 login attempt for non-active account: userId={}", user.getId());
            response.sendRedirect(frontendUrl + "/login?error=account_suspended");
            return;
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        String accessToken = jwtTokenProvider.generateAccessToken(user);
        String rawRefreshToken = jwtTokenProvider.generateRefreshTokenValue();

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setTokenHash(hashToken(rawRefreshToken));
        refreshToken.setExpiresAt(
            Instant.now().plusMillis(jwtTokenProvider.getRefreshTokenExpiryMs()));
        refreshToken.setIpAddress(request.getRemoteAddr());
        refreshTokenRepository.save(refreshToken);

        auditService.log(user.getId(), "OAUTH2_LOGIN_SUCCESS", "USER", user.getId(),
                        request.getRemoteAddr(), null, AuditLog.Outcome.SUCCESS, null);

        // Redirect to frontend with tokens — frontend extracts and clears from URL
        String redirectUrl = String.format(
            "%s/oauth2/callback#access_token=%s&refresh_token=%s",
            frontendUrl.split(",")[0].trim(),  // first allowed origin
            accessToken,
            rawRefreshToken
        );
        response.sendRedirect(redirectUrl);
    }

    private User provisionOAuth2User(
            String email, String googleId, String firstName,
            String lastName, String pictureUrl) {

        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
            .orElseThrow(() -> new IllegalStateException("ROLE_CUSTOMER not found"));

        User user = new User();
        user.setEmail(email.toLowerCase());
        user.setFirstName(firstName != null ? firstName : "");
        user.setLastName(lastName != null ? lastName : "");
        user.setOauth2Provider("google");
        user.setOauth2ProviderId(googleId);
        user.setProfileImageUrl(pictureUrl);
        user.setRole(customerRole);
        user.setEmailVerified(true);  // Google accounts have verified email
        user.setStatus(User.UserStatus.ACTIVE);
        // No passwordHash set — this user can only log in via Google
        user = userRepository.save(user);

        Wallet wallet = new Wallet();
        wallet.setUser(user);
        walletRepository.save(wallet);

        log.info("New OAuth2 user provisioned: userId={}, provider=google", user.getId());
        return user;
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
