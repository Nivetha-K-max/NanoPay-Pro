package com.nanopay.core.service;

import com.nanopay.infrastructure.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Transactional because User.role is EAGER-loaded —
     * if this runs outside a transaction (e.g., in a test), the role join
     * would fail with LazyInitializationException.
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException(
                // Security: generic message — don't confirm whether email exists
                "User not found"
            ));
    }
}
