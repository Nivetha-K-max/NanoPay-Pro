package com.nanopay.infrastructure.repository;

import com.nanopay.core.domain.entity.MerchantProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MerchantProfileRepository extends JpaRepository<MerchantProfile, Long> {

    Optional<MerchantProfile> findByUserId(Long userId);
}
