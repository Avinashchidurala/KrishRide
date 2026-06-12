package com.hushryd.backend.controller;

import com.hushryd.backend.dto.ApiResponse;
import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.security.UserPrincipal;
import com.hushryd.backend.service.WalletService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {

    @Autowired
    private WalletService walletService;

    @GetMapping("/balance")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getWalletBalance(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        BigDecimal balance = walletService.getWalletBalance(userPrincipal.getId(), userPrincipal.getRole());
        Map<String, Object> data = new HashMap<>();
        data.put("balance", balance.doubleValue());
        data.put("currency", "INR");

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @GetMapping("/transactions")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCustomerTransactions(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        Map<String, Object> data = walletService.getCustomerTransactions(userPrincipal.getId(), page, limit);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @GetMapping("/admin/transactions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAdminTransactions(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        Map<String, Object> data = walletService.getAdminTransactions(userPrincipal.getId(), page, limit);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @GetMapping("/transactions/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDriverTransactions(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String id,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        Map<String, Object> data = walletService.getDriverTransactions(id, page, limit);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @PostMapping("/apply")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> applyWalletBalance(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody Map<String, Object> body) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        String bookingId = (String) body.get("bookingId");
        Number amount = (Number) body.get("amount");

        BigDecimal amountVal = amount != null ? BigDecimal.valueOf(amount.doubleValue()) : null;

        walletService.applyWalletBalance(userPrincipal.getId(), bookingId, amountVal);

        Map<String, Object> data = new HashMap<>();
        data.put("message", "Wallet balance applied successfully");

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }
}
