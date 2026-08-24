package com.nanopay.api.controller;

import com.nanopay.common.dto.fraud.FraudFlagResponse;
import com.nanopay.common.dto.fraud.FraudReviewRequest;
import com.nanopay.common.response.ApiResponse;
import com.nanopay.common.response.PagedResponse;
import com.nanopay.core.domain.entity.FraudFlag;
import com.nanopay.core.domain.entity.User;
import com.nanopay.core.service.FraudAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/fraud")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Fraud Admin", description = "Admin fraud flag management")
public class FraudAdminController {

    private final FraudAdminService fraudAdminService;

    @GetMapping("/flags")
    @Operation(summary = "List fraud flags with optional status and severity filter")
    public ResponseEntity<ApiResponse<PagedResponse<FraudFlagResponse>>> listFlags(
            @RequestParam(required = false) FraudFlag.FlagStatus status,
            @RequestParam(required = false) FraudFlag.Severity severity,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        var result = status == null && severity == null
            ? fraudAdminService.getAllFlags(null,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
            : fraudAdminService.getOpenFlags(severity,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "fraudScore")));

        return ResponseEntity.ok(ApiResponse.success(new PagedResponse<>(result)));
    }

    @GetMapping("/flags/{id}")
    @Operation(summary = "Get a single fraud flag by ID")
    public ResponseEntity<ApiResponse<FraudFlagResponse>> getFlag(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(fraudAdminService.getFlag(id)));
    }

    @PatchMapping("/flags/{id}/resolve")
    @Operation(summary = "Resolve a fraud flag")
    public ResponseEntity<ApiResponse<FraudFlagResponse>> resolve(
            @PathVariable Long id,
            @Valid @RequestBody FraudReviewRequest request,
            @AuthenticationPrincipal User admin,
            HttpServletRequest httpRequest) {

        return ResponseEntity.ok(ApiResponse.success(
            fraudAdminService.resolveFlag(id, admin.getId(), request, getClientIp(httpRequest))));
    }

    @PostMapping("/transactions/{txId}/flag")
    @Operation(summary = "Manually flag a transaction for review")
    public ResponseEntity<ApiResponse<FraudFlagResponse>> manualFlag(
            @PathVariable Long txId,
            @RequestParam @Size(max = 500, message = "Reason must not exceed 500 characters") String reason,
            @AuthenticationPrincipal User admin,
            HttpServletRequest httpRequest) {

        return ResponseEntity.status(201).body(ApiResponse.success(
            fraudAdminService.manualFlag(txId, admin.getId(), reason, getClientIp(httpRequest))));
    }

    @PatchMapping("/users/{userId}/status")
    @Operation(summary = "Set account status (suspend or reinstate)")
    public ResponseEntity<ApiResponse<Void>> setAccountStatus(
            @PathVariable Long userId,
            @RequestParam User.UserStatus status,
            @RequestParam String reason,
            @AuthenticationPrincipal User admin,
            HttpServletRequest httpRequest) {

        fraudAdminService.setAccountStatus(
            userId, status, admin.getId(), reason, getClientIp(httpRequest));
        return ResponseEntity.ok(ApiResponse.success("Account status updated to " + status, null));
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return forwarded != null ? forwarded.split(",")[0].trim() : request.getRemoteAddr();
    }
}
