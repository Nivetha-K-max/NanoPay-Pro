package com.nanopay.core.service;

import com.nanopay.common.dto.fraud.FraudFlagResponse;
import com.nanopay.common.dto.fraud.FraudReviewRequest;
import com.nanopay.common.exception.NanoPayException;
import com.nanopay.common.exception.ResourceNotFoundException;
import com.nanopay.core.domain.entity.*;
import com.nanopay.core.repository.FraudFlagRepository;
import com.nanopay.core.repository.TransactionRepository;
import com.nanopay.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FraudAdminService {

    private final FraudFlagRepository   fraudFlagRepository;
    private final UserRepository        userRepository;
    private final TransactionRepository transactionRepository;
    private final AuditService          auditService;

    @Transactional(readOnly = true)
    public Page<FraudFlagResponse> getOpenFlags(FraudFlag.Severity severity, Pageable pageable) {
        Page<FraudFlag> flags = severity != null
            ? fraudFlagRepository.findByStatusAndSeverity(FraudFlag.FlagStatus.OPEN, severity, pageable)
            : fraudFlagRepository.findByStatus(FraudFlag.FlagStatus.OPEN, pageable);
        return flags.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<FraudFlagResponse> getAllFlags(FraudFlag.FlagStatus status, Pageable pageable) {
        Page<FraudFlag> flags = status != null
            ? fraudFlagRepository.findByStatus(status, pageable)
            : fraudFlagRepository.findAll(pageable);
        return flags.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public FraudFlagResponse getFlag(Long flagId) {
        return fraudFlagRepository.findById(flagId)
            .map(this::toResponse)
            .orElseThrow(() -> new ResourceNotFoundException("FraudFlag", "id", flagId));
    }

    @Transactional
    public FraudFlagResponse resolveFlag(Long flagId, Long adminUserId,
                                          FraudReviewRequest request, String ipAddress) {
        FraudFlag flag = fraudFlagRepository.findById(flagId)
            .orElseThrow(() -> new ResourceNotFoundException("FraudFlag", "id", flagId));

        if (flag.getStatus() != FraudFlag.FlagStatus.OPEN &&
            flag.getStatus() != FraudFlag.FlagStatus.UNDER_REVIEW) {
            throw new NanoPayException(
                "Flag has already been resolved: " + flag.getStatus(),
                HttpStatus.CONFLICT, "FLAG_ALREADY_RESOLVED");
        }

        User admin = userRepository.findById(adminUserId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", adminUserId));

        FraudFlag.FlagStatus newStatus = switch (request.getResolution()) {
            case RESOLVED_LEGITIMATE -> FraudFlag.FlagStatus.RESOLVED_LEGITIMATE;
            case RESOLVED_FRAUDULENT -> FraudFlag.FlagStatus.RESOLVED_FRAUDULENT;
            case DISMISSED           -> FraudFlag.FlagStatus.DISMISSED;
            default -> throw new NanoPayException(
                "Unknown resolution: " + request.getResolution(),
                HttpStatus.BAD_REQUEST, "INVALID_RESOLUTION");
        };

        flag.setStatus(newStatus);
        flag.setReviewedBy(admin);
        flag.setReviewedAt(Instant.now());
        flag.setReviewNotes(request.getNotes());
        fraudFlagRepository.save(flag);

        handleAccountStatusAfterReview(flag.getUser(), request.getResolution());

        auditService.log(adminUserId, "FRAUD_FLAG_RESOLVED", "FRAUD_FLAG", flagId,
            ipAddress, null, AuditLog.Outcome.SUCCESS,
            Map.of("resolution", request.getResolution().name(),
                   "flagId", flagId,
                   "userId", flag.getUser().getId()));

        log.info("Fraud flag resolved: flagId={}, resolution={}, adminId={}",
            flagId, request.getResolution(), adminUserId);

        return toResponse(flag);
    }

    @Transactional
    public FraudFlagResponse manualFlag(Long transactionId, Long adminUserId,
                                         String reason, String ipAddress) {
        Transaction transaction = transactionRepository.findById(transactionId)
            .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", transactionId));

        User admin = userRepository.findById(adminUserId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", adminUserId));

        FraudFlag flag = new FraudFlag();
        flag.setTransaction(transaction);
        flag.setUser(transaction.getInitiatedBy());
        flag.setFlagType(FraudFlag.FlagType.MANUAL_REVIEW);
        flag.setSeverity(FraudFlag.Severity.MEDIUM);
        flag.setFraudScore(java.math.BigDecimal.valueOf(50));
        flag.setStatus(FraudFlag.FlagStatus.UNDER_REVIEW);
        flag.setDetails(Map.of("manualFlag", true, "flaggedBy", adminUserId, "reason", reason));
        flag.setReviewedBy(admin);
        flag.setReviewedAt(Instant.now());
        flag.setReviewNotes("Manually flagged: " + reason);
        fraudFlagRepository.save(flag);

        auditService.log(adminUserId, "FRAUD_FLAG_MANUAL", "TRANSACTION",
            transactionId, ipAddress, null, AuditLog.Outcome.SUCCESS, null);

        return toResponse(flag);
    }

    @Transactional
    public void setAccountStatus(Long userId, User.UserStatus newStatus,
                                  Long adminUserId, String reason, String ipAddress) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        User.UserStatus oldStatus = user.getStatus();
        user.setStatus(newStatus);
        if (newStatus == User.UserStatus.ACTIVE) user.resetFailedAttempts();
        userRepository.save(user);

        auditService.log(adminUserId, "ADMIN_ACCOUNT_STATUS_CHANGE", "USER",
            userId, ipAddress, null, AuditLog.Outcome.SUCCESS,
            Map.of("from", oldStatus.name(), "to", newStatus.name(), "reason", reason));

        log.info("Account status changed by admin: userId={}, from={}, to={}, adminId={}",
            userId, oldStatus, newStatus, adminUserId);
    }

    // ── Private helpers ────────────────────────────────────────────────────

    private void handleAccountStatusAfterReview(User user, FraudReviewRequest.Resolution resolution) {
        switch (resolution) {
            case RESOLVED_LEGITIMATE, DISMISSED -> {
                if (user.getStatus() == User.UserStatus.SUSPENDED) {
                    long remainingFlags = fraudFlagRepository.countActiveFlags(user.getId());
                    if (remainingFlags == 0) {
                        user.setStatus(User.UserStatus.ACTIVE);
                        user.resetFailedAttempts();
                        userRepository.save(user);
                        log.info("Account reinstated after fraud review: userId={}", user.getId());
                    }
                }
            }
            case RESOLVED_FRAUDULENT -> {
                if (user.getStatus() != User.UserStatus.SUSPENDED) {
                    user.setStatus(User.UserStatus.SUSPENDED);
                    userRepository.save(user);
                }
            }
            default -> log.warn("Unhandled resolution type in account status handler: {}", resolution);
        }
    }

    private FraudFlagResponse toResponse(FraudFlag flag) {
        Transaction tx = flag.getTransaction();
        return FraudFlagResponse.builder()
                .id(flag.getId())
                .transactionId(tx.getId())
                .referenceNumber(tx.getReferenceNumber())
                .userId(flag.getUser().getId())
                .userEmail(flag.getUser().getEmail())
                .flagType(flag.getFlagType().name())
                .severity(flag.getSeverity().name())
                .fraudScore(flag.getFraudScore())
                .details(flag.getDetails())
                .status(flag.getStatus().name())
                .reviewedByEmail(flag.getReviewedBy() != null ? flag.getReviewedBy().getEmail() : null)
                .reviewedAt(flag.getReviewedAt())
                .reviewNotes(flag.getReviewNotes())
                .createdAt(flag.getCreatedAt())
                .transactionAmount(tx.getAmount())
                .transactionCurrency(tx.getCurrency())
                .transactionType(tx.getType().name())
                .transactionStatus(tx.getStatus().name())
                .build();
    }
}
