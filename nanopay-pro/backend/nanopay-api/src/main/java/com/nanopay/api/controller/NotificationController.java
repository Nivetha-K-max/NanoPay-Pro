package com.nanopay.api.controller;

import com.nanopay.common.response.ApiResponse;
import com.nanopay.common.response.PagedResponse;
import com.nanopay.core.domain.entity.Notification;
import com.nanopay.core.domain.entity.User;
import com.nanopay.core.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Get paginated notifications for current user")
    public ResponseEntity<ApiResponse<PagedResponse<Notification>>> getNotifications(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        var result = notificationService.getNotifications(
            user.getId(),
            PageRequest.of(page, Math.min(size, 50),
                Sort.by(Sort.Direction.DESC, "createdAt")));

        return ResponseEntity.ok(ApiResponse.success(new PagedResponse<>(result)));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get unread notification count (for badge)")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(
            ApiResponse.success(notificationService.getUnreadCount(user.getId())));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark a single notification as read")
    public ResponseEntity<ApiResponse<Void>> markRead(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        notificationService.markRead(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/read-all")
    @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<ApiResponse<Integer>> markAllRead(
            @AuthenticationPrincipal User user) {
        int count = notificationService.markAllRead(user.getId());
        return ResponseEntity.ok(
            ApiResponse.success("Marked " + count + " notifications as read", count));
    }
}
