package com.hushryd.backend.controller;

import com.hushryd.backend.dto.ApiResponse;
import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.entity.SosAlert;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.security.UserPrincipal;
import com.hushryd.backend.service.SosAlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sos")
public class SosAlertController {

    @Autowired
    private SosAlertService sosAlertService;

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> createSosAlert(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody Map<String, Object> body) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        Number latitude = (Number) body.get("latitude");
        Number longitude = (Number) body.get("longitude");
        String message = (String) body.get("message");
        String bookingId = (String) body.get("bookingId");

        BigDecimal latVal = latitude != null ? BigDecimal.valueOf(latitude.doubleValue()) : null;
        BigDecimal lngVal = longitude != null ? BigDecimal.valueOf(longitude.doubleValue()) : null;

        Map<String, Object> data = sosAlertService.createSosAlert(
                userPrincipal.getId(), latVal, lngVal, message, bookingId);

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserSosAlerts(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        List<SosAlert> alerts = sosAlertService.getUserSosAlerts(userPrincipal.getId());
        Map<String, Object> data = new HashMap<>();
        data.put("sosAlerts", alerts);

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateSosAlertStatus(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        String status = (String) body.get("status");
        if (status == null || status.trim().isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Status is required");
        }

        SosAlert alert = sosAlertService.updateSosAlertStatus(id, status.trim());
        Map<String, Object> data = new HashMap<>();
        data.put("sosAlert", alert);

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }
}
