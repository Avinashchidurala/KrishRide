package com.hushryd.backend.controller;

import com.hushryd.backend.dto.ApiResponse;
import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.entity.ChatSession;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.security.UserPrincipal;
import com.hushryd.backend.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @PostMapping("/sessions")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createOrGetSession(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        Map<String, Object> data = chatService.createOrGetSession(
                userPrincipal.getId(), userPrincipal.getRole());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSessionWithMessages(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String sessionId) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        Map<String, Object> data = chatService.getSessionWithMessages(
                userPrincipal.getId(), userPrincipal.getRole(), sessionId);

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @GetMapping("/sessions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSessions(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(defaultValue = "active") String status) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        Map<String, Object> data = chatService.getSessions(page, limit, status);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @PatchMapping("/sessions/{sessionId}/close")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> closeSession(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String sessionId) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        ChatSession session = chatService.closeSession(sessionId);
        Map<String, Object> data = new HashMap<>();
        data.put("session", session);

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @PatchMapping("/sessions/{sessionId}/read")
    public ResponseEntity<ApiResponse<Map<String, Object>>> markMessagesAsRead(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String sessionId) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        chatService.markMessagesAsRead(sessionId, userPrincipal.getId());
        Map<String, Object> data = new HashMap<>();
        data.put("success", true);

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }
}
