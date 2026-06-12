package com.hushryd.backend.controller;

import com.hushryd.backend.dto.ApiResponse;
import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.entity.Notification;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.security.UserPrincipal;
import com.hushryd.backend.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserNotifications(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "false") boolean unreadOnly) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        Map<String, Object> data = notificationService.getUserNotifications(
                userPrincipal.getId(), page, limit, unreadOnly);

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        long count = notificationService.getUnreadCount(userPrincipal.getId());
        Map<String, Object> data = new HashMap<>();
        data.put("count", count);

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Map<String, Object>>> markAsRead(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String id) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        Notification notification = notificationService.markAsRead(userPrincipal.getId(), id);
        Map<String, Object> data = new HashMap<>();
        data.put("notification", notification);

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Map<String, Object>>> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        notificationService.markAllAsRead(userPrincipal.getId());
        Map<String, Object> data = new HashMap<>();
        data.put("message", "All notifications marked as read");

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }
}
