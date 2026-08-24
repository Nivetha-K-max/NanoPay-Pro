package com.nanopay.core.service;

import com.nanopay.common.dto.transaction.*;
import com.nanopay.common.event.TransactionEvent;
import com.nanopay.common.exception.FraudDetectedException;
import com.nanopay.common.exception.InsufficientFundsException;
import com.nanopay.common.exception.NanoPayException;
import com.nanopay.core.domain.entity.Transaction;
import com.nanopay.core.domain.entity.TransactionLog;
import com.nanopay.core.domain.entity.User;
import com.nanopay.core.domain.entity.Wallet;
import com.nanopay.core.mapper.TransactionMapper;
import com.nanopay.core.repository.TransactionRepository;
import com.nanopay.core.repository.UserRepository;
import com.nanopay.core.repository.WalletRepository;
import com.nanopay.infrastructure.kafka.TransactionEventProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import org.springframework.http.HttpStatus;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;
    private final UserRepository userRepository;
    private final TransactionMapper transactionMapper;
    private final FraudDetectionService fraudDetectionService;
    private final TransactionEventProducer eventProducer;
    private final AuditService auditService;

    // ── Deposit ───────────────────────────────────────────────────────────

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public TransactionResponse deposit(Long userId, DepositRequest request, String ipAddress) {
        Transaction existing = transactionRepository.findByIdempotencyKey(request.getIdempotencyKey()).orElse(null);
        if (existing != null) {
            return transactionMapper.toResponse(existing);
        }

        User user = loadUser(userId);

        Wallet wallet = walletRepository
                .findByUserIdAndCurrencyWithLock(userId, request.getCurrency())
                .orElseThrow(() -> new com.nanopay.common.exception.ResourceNotFoundException("Wallet", "userId", userId));

        validateWalletActive(wallet);

        Transaction tx = buildTransaction(
                request.getIdempotencyKey(),
                Transaction.TransactionType.DEPOSIT,
                null,
                wallet,
                request.getAmount(),
                request.getCurrency(),
                BigDecimal.ZERO,
                request.getDescription(),
                ipAddress,
                user
        );
        tx.transitionTo(Transaction.TransactionStatus.PENDING, null, "Deposit initiated");
        tx = transactionRepository.save(tx);

        try {
            tx.transitionTo(Transaction.TransactionStatus.PROCESSING, null, "Processing deposit");
            tx = transactionRepository.save(tx);

            BigDecimal fraudScore = fraudDetectionService.evaluate(tx, null);
            tx.setFraudScore(fraudScore);
            tx.setFraudChecked(true);
            tx = transactionRepository.save(tx);

            wallet.credit(request.getAmount());
            walletRepository.save(wallet);

            tx.transitionTo(Transaction.TransactionStatus.SUCCESS, null, "Deposit completed");
            tx.setCompletedAt(Instant.now());
            tx = transactionRepository.save(tx);

            publishEvent(tx, true);
            auditService.log(userId, "DEPOSIT", "TRANSACTION", tx.getId(), ipAddress, null,
                    com.nanopay.core.domain.entity.AuditLog.Outcome.SUCCESS, null);

            return transactionMapper.toResponse(tx);

        } catch (FraudDetectedException e) {
            failTransaction(tx, user, "FRAUD_BLOCKED: " + e.getMessage());
            throw e;
        } catch (Exception e) {
            failTransaction(tx, user, "SYSTEM_ERROR: " + e.getMessage());
            throw e;
        }
    }

    // ── Withdrawal ────────────────────────────────────────────────────────

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public TransactionResponse withdraw(Long userId, WithdrawalRequest request, String ipAddress) {
        Transaction existing = transactionRepository.findByIdempotencyKey(request.getIdempotencyKey()).orElse(null);
        if (existing != null) {
            return transactionMapper.toResponse(existing);
        }

        User user = loadUser(userId);

        Wallet wallet = walletRepository
                .findByUserIdAndCurrencyWithLock(userId, request.getCurrency())
                .orElseThrow(() -> new com.nanopay.common.exception.ResourceNotFoundException("Wallet", "userId", userId));

        validateWalletActive(wallet);

        if (!wallet.hasSufficientBalance(request.getAmount())) {
            throw new InsufficientFundsException();
        }

        Transaction tx = buildTransaction(
                request.getIdempotencyKey(),
                Transaction.TransactionType.WITHDRAWAL,
                wallet,
                null,
                request.getAmount(),
                request.getCurrency(),
                calculateFee(request.getAmount()),
                request.getDescription(),
                ipAddress,
                user
        );
        tx.transitionTo(Transaction.TransactionStatus.PENDING, null, "Withdrawal initiated");
        tx = transactionRepository.save(tx);

        try {
            tx.transitionTo(Transaction.TransactionStatus.PROCESSING, null, "Processing withdrawal");
            tx = transactionRepository.save(tx);

            BigDecimal fraudScore = fraudDetectionService.evaluate(tx, wallet);
            tx.setFraudScore(fraudScore);
            tx.setFraudChecked(true);
            tx = transactionRepository.save(tx);

            wallet.debit(request.getAmount());
            walletRepository.save(wallet);

            tx.transitionTo(Transaction.TransactionStatus.SUCCESS, null, "Withdrawal completed");
            tx.setCompletedAt(Instant.now());
            tx = transactionRepository.save(tx);

            publishEvent(tx, true);
            auditService.log(userId, "WITHDRAWAL", "TRANSACTION", tx.getId(), ipAddress, null,
                    com.nanopay.core.domain.entity.AuditLog.Outcome.SUCCESS, null);

            return transactionMapper.toResponse(tx);

        } catch (FraudDetectedException | InsufficientFundsException e) {
            failTransaction(tx, user, e.getMessage());
            throw e;
        } catch (Exception e) {
            failTransaction(tx, user, "SYSTEM_ERROR: " + e.getMessage());
            throw e;
        }
    }

    // ── Transfer ──────────────────────────────────────────────────────────

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public TransactionResponse transfer(Long senderUserId, TransferRequest request, String ipAddress) {
        Transaction existing = transactionRepository.findByIdempotencyKey(request.getIdempotencyKey()).orElse(null);
        if (existing != null) {
            return transactionMapper.toResponse(existing);
        }

        User sender = loadUser(senderUserId);
        User recipient = userRepository.findByEmail(request.getRecipientEmail())
                .orElseThrow(() -> new com.nanopay.common.exception.ResourceNotFoundException(
                        "User", "email", request.getRecipientEmail()));

        if (sender.getId().equals(recipient.getId())) {
            throw new NanoPayException("Cannot transfer to your own wallet", HttpStatus.BAD_REQUEST, "SELF_TRANSFER");
        }

        Wallet senderWallet = walletRepository
                .findByUserIdAndCurrency(senderUserId, request.getCurrency())
                .orElseThrow(() -> new com.nanopay.common.exception.ResourceNotFoundException("Wallet", "userId", senderUserId));

        Wallet receiverWallet = walletRepository
                .findByUserIdAndCurrency(recipient.getId(), request.getCurrency())
                .orElseThrow(() -> new com.nanopay.common.exception.ResourceNotFoundException("Wallet", "userId", recipient.getId()));

        validateWalletActive(senderWallet);
        validateWalletActive(receiverWallet);

        // lock in ascending wallet id order
        Wallet first;
        Wallet second;
        if (senderWallet.getId() < receiverWallet.getId()) {
            first = walletRepository.findByIdWithLock(senderWallet.getId()).orElseThrow();
            second = walletRepository.findByIdWithLock(receiverWallet.getId()).orElseThrow();
        } else {
            first = walletRepository.findByIdWithLock(receiverWallet.getId()).orElseThrow();
            second = walletRepository.findByIdWithLock(senderWallet.getId()).orElseThrow();
        }

        Wallet lockedSender = first.getId().equals(senderWallet.getId()) ? first : second;
        Wallet lockedReceiver = first.getId().equals(receiverWallet.getId()) ? first : second;

        if (!lockedSender.hasSufficientBalance(request.getAmount())) {
            throw new InsufficientFundsException();
        }

        BigDecimal fee = calculateFee(request.getAmount());

        Transaction tx = buildTransaction(
                request.getIdempotencyKey(),
                Transaction.TransactionType.TRANSFER,
                lockedSender,
                lockedReceiver,
                request.getAmount(),
                request.getCurrency(),
                fee,
                request.getDescription(),
                ipAddress,
                sender
        );
        tx.transitionTo(Transaction.TransactionStatus.PENDING, null, "Transfer initiated");
        tx = transactionRepository.save(tx);

        try {
            tx.transitionTo(Transaction.TransactionStatus.PROCESSING, null, "Processing transfer");
            tx = transactionRepository.save(tx);

            BigDecimal fraudScore = fraudDetectionService.evaluate(tx, lockedSender);
            tx.setFraudScore(fraudScore);
            tx.setFraudChecked(true);
            tx = transactionRepository.save(tx);

            lockedSender.debit(request.getAmount());
            lockedReceiver.credit(tx.getNetAmount());
            walletRepository.save(lockedSender);
            walletRepository.save(lockedReceiver);

            tx.transitionTo(Transaction.TransactionStatus.SUCCESS, null, "Transfer completed");
            tx.setCompletedAt(Instant.now());
            tx = transactionRepository.save(tx);

            publishEvent(tx, true);
            auditService.log(senderUserId, "TRANSFER", "TRANSACTION", tx.getId(), ipAddress, null,
                    com.nanopay.core.domain.entity.AuditLog.Outcome.SUCCESS, null);

            return transactionMapper.toResponse(tx);

        } catch (FraudDetectedException | InsufficientFundsException e) {
            failTransaction(tx, sender, e.getMessage());
            throw e;
        } catch (Exception e) {
            failTransaction(tx, sender, "SYSTEM_ERROR: " + e.getMessage());
            throw e;
        }
    }

    // ── Reversal ──────────────────────────────────────────────────────────

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public TransactionResponse reverse(Long originalTxId, Long adminUserId, String reason, String ipAddress) {
        Transaction original = transactionRepository.findById(originalTxId)
                .orElseThrow(() -> new com.nanopay.common.exception.ResourceNotFoundException("Transaction", "id", originalTxId));

        if (!original.isReversible()) {
            throw new NanoPayException(
                    "Transaction cannot be reversed in its current state",
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "NOT_REVERSIBLE"
            );
        }

        User admin = loadUser(adminUserId);

        Wallet senderWallet = original.getSenderWallet();
        Wallet receiverWallet = original.getReceiverWallet();
        if (senderWallet == null || receiverWallet == null) {
            throw new NanoPayException(
                    "Cannot reverse a deposit or withdrawal — manual reconciliation required",
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "REVERSAL_NOT_SUPPORTED"
            );
        }

        Wallet first;
        Wallet second;
        if (senderWallet.getId() < receiverWallet.getId()) {
            first = walletRepository.findByIdWithLock(senderWallet.getId()).orElseThrow();
            second = walletRepository.findByIdWithLock(receiverWallet.getId()).orElseThrow();
        } else {
            first = walletRepository.findByIdWithLock(receiverWallet.getId()).orElseThrow();
            second = walletRepository.findByIdWithLock(senderWallet.getId()).orElseThrow();
        }

        Wallet lockedSender = first.getId().equals(senderWallet.getId()) ? first : second;
        Wallet lockedReceiver = first.getId().equals(receiverWallet.getId()) ? first : second;

        String idempotencyKey = "reversal-" + originalTxId + "-" + UUID.randomUUID();

        Transaction reversal = buildTransaction(
                idempotencyKey,
                Transaction.TransactionType.REVERSAL,
                lockedReceiver,
                lockedSender,
                original.getNetAmount(),
                original.getCurrency(),
                BigDecimal.ZERO,
                "Reversal of " + original.getReferenceNumber(),
                ipAddress,
                admin
        );
        reversal.transitionTo(Transaction.TransactionStatus.PENDING, admin, "Reversal initiated by admin");
        reversal = transactionRepository.save(reversal);

        // money back: receiver -> sender (reverse direction)
        lockedReceiver.debit(original.getNetAmount());
        lockedSender.credit(original.getNetAmount());
        walletRepository.save(lockedSender);
        walletRepository.save(lockedReceiver);

        reversal.transitionTo(Transaction.TransactionStatus.SUCCESS, admin, "Reversal completed: " + reason);
        reversal.setCompletedAt(Instant.now());
        reversal = transactionRepository.save(reversal);

        original.transitionTo(Transaction.TransactionStatus.REVERSED, admin, "Reversed by admin: " + reason);
        original.setReversedById(reversal.getId());
        transactionRepository.save(original);

        auditService.log(adminUserId, "TRANSACTION_REVERSED", "TRANSACTION", originalTxId, ipAddress, null,
                com.nanopay.core.domain.entity.AuditLog.Outcome.SUCCESS, null);

        publishEvent(reversal, true);
        return transactionMapper.toResponse(reversal);
    }

    // ── Queries ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public TransactionResponse getTransaction(Long txId, Long requestingUserId) {
        Transaction tx = transactionRepository.findById(txId)
                .orElseThrow(() -> new com.nanopay.common.exception.ResourceNotFoundException("Transaction", "id", txId));

        boolean isSender = tx.getSenderWallet() != null && tx.getSenderWallet().getUser().getId().equals(requestingUserId);
        boolean isReceiver = tx.getReceiverWallet() != null && tx.getReceiverWallet().getUser().getId().equals(requestingUserId);
        boolean isOwner = tx.getInitiatedBy().getId().equals(requestingUserId);

        if (!isSender && !isReceiver && !isOwner) {
            throw new AccessDeniedException("Access denied to transaction " + txId);
        }

        // ensure logs are initialized if needed by mapper
        tx.getLogs().size();
        return transactionMapper.toResponse(tx);
    }

    @Transactional(readOnly = true)
    public Page<TransactionResponse> getWalletHistory(Long userId,
                                                       String currency,
                                                       Instant from,
                                                       Instant to,
                                                       Pageable pageable) {
        Wallet wallet = walletRepository.findByUserIdAndCurrency(userId, currency)
                .orElseThrow(() -> new com.nanopay.common.exception.ResourceNotFoundException("Wallet", "userId", userId));

        return transactionRepository.findByWalletIdAndDateRange(wallet.getId(), from, to, pageable)
                .map(transactionMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public com.nanopay.common.dto.wallet.WalletResponse getWallet(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new com.nanopay.common.exception.ResourceNotFoundException("Wallet", "userId", userId));
        return transactionMapper.toWalletResponse(wallet);
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    private Transaction buildTransaction(String idempotencyKey,
                                          Transaction.TransactionType type,
                                          Wallet sender,
                                          Wallet receiver,
                                          BigDecimal amount,
                                          String currency,
                                          BigDecimal fee,
                                          String description,
                                          String ipAddress,
                                          User initiatedBy) {
        Transaction tx = new Transaction();
        tx.setReferenceNumber(UUID.randomUUID().toString());
        tx.setIdempotencyKey(idempotencyKey);
        tx.setType(type);
        tx.setSenderWallet(sender);
        tx.setReceiverWallet(receiver);
        tx.setAmount(amount);
        tx.setCurrency(currency);
        tx.setFee(fee);
        tx.setNetAmount(amount.subtract(fee));
        tx.setDescription(description);
        tx.setIpAddress(ipAddress);
        tx.setInitiatedBy(initiatedBy);
        return tx;
    }

    private void failTransaction(Transaction tx, User changedBy, String reason) {
        try {
            tx.transitionTo(Transaction.TransactionStatus.FAILED, changedBy, reason);
            transactionRepository.save(tx);
            publishEvent(tx, false);
        } catch (Exception e) {
            log.error("Failed to persist transaction failure state for txId={}: {}", tx.getId(), e.getMessage());
        }
    }

    private void publishEvent(Transaction tx, boolean completed) {
        TransactionEvent event = TransactionEvent.builder()
                .eventType(completed ? "COMPLETED" : "FAILED")
                .transactionId(tx.getId())
                .referenceNumber(tx.getReferenceNumber())
                .transactionType(tx.getType().name())
                .status(tx.getStatus().name())
                .senderWalletId(tx.getSenderWallet() != null ? tx.getSenderWallet().getId() : null)
                .senderUserId(tx.getSenderWallet() != null ? tx.getSenderWallet().getUser().getId() : null)
                .receiverWalletId(tx.getReceiverWallet() != null ? tx.getReceiverWallet().getId() : null)
                .receiverUserId(tx.getReceiverWallet() != null ? tx.getReceiverWallet().getUser().getId() : null)
                .amount(tx.getAmount())
                .currency(tx.getCurrency())
                .fee(tx.getFee())
                .netAmount(tx.getNetAmount())
                .fraudScore(tx.getFraudScore())
                .ipAddress(tx.getIpAddress())
                .occurredAt(Instant.now())
                .build();

        if (completed) {
            eventProducer.publishTransactionCompleted(event);
        } else {
            eventProducer.publishTransactionInitiated(event);
        }
    }

    private User loadUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new com.nanopay.common.exception.ResourceNotFoundException("User", "id", userId));
    }

    private void validateWalletActive(Wallet wallet) {
        if (!wallet.isActive()) {
            throw new NanoPayException(
                    "Wallet is not active: " + wallet.getStatus(),
                    HttpStatus.FORBIDDEN,
                    "WALLET_NOT_ACTIVE"
            );
        }
    }

    /**
     * Fee schedule: 0.5% for transfers.
     */
    private BigDecimal calculateFee(BigDecimal amount) {
        BigDecimal fee = amount.multiply(new BigDecimal("0.005"))
                .setScale(4, java.math.RoundingMode.HALF_UP);
        BigDecimal minFee = new BigDecimal("0.2500");
        BigDecimal maxFee = new BigDecimal("25.0000");
        return fee.max(minFee).min(maxFee);
    }
}

