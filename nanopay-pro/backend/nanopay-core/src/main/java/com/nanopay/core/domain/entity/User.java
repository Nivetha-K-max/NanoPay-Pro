package com.nanopay.core.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

/**
 * Implements UserDetails so Spring Security can work directly with this entity.
 * This avoids a separate UserDetailsAdapter class and keeps the auth model clean.
 *
 * @Version on 'version' field enables optimistic locking:
 * if two threads try to update the same user simultaneously, one will get
 * an OptimisticLockException, preventing lost updates.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "users")
public class User extends BaseEntity implements UserDetails {

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    // Nullable — OAuth2 users have no local password
    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @ManyToOne(fetch = FetchType.EAGER)  // EAGER: role always needed for security checks
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    @Column(name = "failed_login_attempts", nullable = false)
    private int failedLoginAttempts = 0;

    @Column(name = "locked_until")
    private Instant lockedUntil;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "password_changed_at")
    private Instant passwordChangedAt;

    @Column(name = "oauth2_provider", length = 50)
    private String oauth2Provider;

    @Column(name = "oauth2_provider_id", length = 255)
    private String oauth2ProviderId;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    // Optimistic lock — Hibernate increments this on every UPDATE.
    // If two transactions read version=5 and both try to write, only one succeeds.
    // The loser gets OptimisticLockException and must retry.
    @Version
    @Column(nullable = false)
    private Long version = 0L;

    // ── UserDetails interface ──────────────────────────────────────────────

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.getName()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;  // email is the unique identifier, not a 'username' field
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;  // we don't expire accounts on a schedule
    }

    @Override
    public boolean isAccountNonLocked() {
        // Account is locked if lockedUntil is set and hasn't passed yet
        return lockedUntil == null || lockedUntil.isBefore(Instant.now());
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;  // credential expiry handled via password policy in service layer
    }

    @Override
    public boolean isEnabled() {
        return status == UserStatus.ACTIVE;
    }

    // ── Domain methods ─────────────────────────────────────────────────────

    public String getFullName() {
        return firstName + " " + lastName;
    }

    public void incrementFailedAttempts() {
        this.failedLoginAttempts++;
    }

    public void resetFailedAttempts() {
        this.failedLoginAttempts = 0;
        this.lockedUntil = null;
    }

    public void lockAccount(Instant until) {
        this.status = UserStatus.LOCKED;
        this.lockedUntil = until;
    }

    public enum UserStatus {
        ACTIVE, SUSPENDED, LOCKED, PENDING_VERIFICATION
    }
}
