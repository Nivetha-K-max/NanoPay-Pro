package com.nanopay.core.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "merchant_profiles")
public class MerchantProfile extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "business_name", nullable = false, length = 255)
    private String businessName;

    @Column(name = "business_type", length = 100)
    private String businessType;

    @Column(name = "registration_number", length = 100)
    private String registrationNumber;

    // Stored encrypted at application layer — service encrypts before persist,
    // decrypts after load. Never query or log this field raw.
    @Column(name = "tax_id", length = 100)
    private String taxId;

    @Column(name = "website_url", length = 500)
    private String websiteUrl;

    @Column(name = "support_email", length = 255)
    private String supportEmail;

    @Column(name = "support_phone", length = 20)
    private String supportPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MerchantStatus status = MerchantStatus.PENDING_VERIFICATION;

    @Column(name = "verification_notes", length = 1000)
    private String verificationNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by")
    private User verifiedBy;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "settlement_schedule", nullable = false, length = 20)
    private SettlementSchedule settlementSchedule = SettlementSchedule.DAILY;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "settlement_wallet_id")
    private Wallet settlementWallet;

    @Column(name = "webhook_url", length = 500)
    private String webhookUrl;

    // HMAC secret — stored hashed, used to sign outbound webhook payloads
    @Column(name = "webhook_secret", length = 255)
    private String webhookSecret;

    @Version
    @Column(nullable = false)
    private Long version = 0L;

    public enum MerchantStatus {
        PENDING_VERIFICATION, ACTIVE, SUSPENDED, REJECTED
    }

    public enum SettlementSchedule {
        DAILY, WEEKLY, MONTHLY
    }
}
