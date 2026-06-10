package com.nanopay.api.controller;

import com.nanopay.common.dto.transaction.*;
import com.nanopay.common.dto.wallet.WalletResponse;
import com.nanopay.common.response.ApiResponse;
import com.nanopay.common.response.PagedResponse;
import com.nanopay.core.domain.entity.User;
import com.nanopay.core.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Transactions", description = "Wallet and transaction operations")
@SecurityRequirement(name = "bearerAuth")
public class TransactionController {

    private final TransactionService transactionService;

    // ── Wallet ─────────────────────────────────────────────────────────────

    @GetMapping("/wallet")
    @Operation(summary = "Get current user's wallet balance and details")
    public ResponseEntity<ApiResponse<WalletResponse>> getWallet(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(
            ApiResponse.success(transactionService.getWallet(user.getId())));
    }

    // ── Transactions ───────────────────────────────────────────────────────

    @PostMapping("/transactions/deposit")
    @Operation(summary = "Deposit funds into wallet")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MERCHANT', 'ADMIN')")
    public ResponseEntity<ApiResponse<TransactionResponse>> deposit(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody DepositRequest request,
            HttpServletRequest httpRequest) {

        TransactionResponse response = transactionService.deposit(
            user.getId(), request, getClientIp(httpRequest));
        return ResponseEntity.status(201).body(ApiResponse.success(response));
    }

    @PostMapping("/transactions/withdraw")
    @Operation(summary = "Withdraw funds from wallet")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MERCHANT', 'ADMIN')")
    public ResponseEntity<ApiResponse<TransactionResponse>> withdraw(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody WithdrawalRequest request,
            HttpServletRequest httpRequest) {

        TransactionResponse response = transactionService.withdraw(
            user.getId(), request, getClientIp(httpRequest));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/transactions/transfer")
    @Operation(summary = "Transfer funds to another user")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MERCHANT', 'ADMIN')")
    public ResponseEntity<ApiResponse<TransactionResponse>> transfer(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody TransferRequest request,
            HttpServletRequest httpRequest) {

        TransactionResponse response = transactionService.transfer(
            user.getId(), request, getClientIp(httpRequest));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/transactions/{id}")
    @Operation(summary = "Get a single transaction by ID")
    public ResponseEntity<ApiResponse<TransactionResponse>> getTransaction(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        return ResponseEntity.ok(
            ApiResponse.success(transactionService.getTransaction(id, user.getId())));
    }

    @GetMapping("/transactions/history")
    @Operation(summary = "Get paginated transaction history for current user")
    public ResponseEntity<ApiResponse<PagedResponse<TransactionResponse>>> getHistory(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "USD") String currency,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        // Default: last 30 days
        Instant effectiveFrom = from != null ? from : Instant.now().minus(30, ChronoUnit.DAYS);
        Instant effectiveTo   = to   != null ? to   : Instant.now();

        // Cap page size to prevent abuse
        int cappedSize = Math.min(size, 100);

        var result = transactionService.getWalletHistory(
            user.getId(), currency, effectiveFrom, effectiveTo,
            PageRequest.of(page, cappedSize, Sort.by(Sort.Direction.DESC, "createdAt")));

        return ResponseEntity.ok(ApiResponse.success(new PagedResponse<>(result)));
    }

    // ── Admin only ─────────────────────────────────────────────────────────

    @PostMapping("/admin/transactions/{id}/reverse")
    @Operation(summary = "Reverse a completed transaction (admin only)")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TransactionResponse>> reverse(
            @PathVariable Long id,
            @RequestParam String reason,
            @AuthenticationPrincipal User admin,
            HttpServletRequest httpRequest) {

        TransactionResponse response = transactionService.reverse(
            id, admin.getId(), reason, getClientIp(httpRequest));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return (forwarded != null) ? forwarded.split(",")[0].trim() : request.getRemoteAddr();
    }
}
