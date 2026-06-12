package com.hushryd.backend.controller;

import com.hushryd.backend.dto.ApiResponse;
import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.dto.PaymentRequests;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.security.UserPrincipal;
import com.hushryd.backend.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping("/razorpay/create-order")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createOrder(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody PaymentRequests.CreateOrderRequest request) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        Map<String, Object> order = paymentService.createOrder(request);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(order).build());
    }

    @PostMapping("/razorpay/verify")
    public ResponseEntity<ApiResponse<Map<String, String>>> verifyPayment(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody PaymentRequests.VerifyPaymentRequest request) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        paymentService.verifyPayment(request);
        Map<String, String> data = new HashMap<>();
        data.put("message", "Payment verified and booking confirmed successfully");

        return ResponseEntity.ok(ApiResponse.<Map<String, String>>builder().data(data).build());
    }

    @PostMapping("/razorpay/failure")
    public ResponseEntity<ApiResponse<Map<String, String>>> handlePaymentFailure(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody Map<String, String> requestBody) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        String bookingId = requestBody.get("bookingId");
        if (bookingId == null) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Booking ID is required");
        }

        paymentService.handlePaymentFailure(bookingId);
        Map<String, String> data = new HashMap<>();
        data.put("message", "Payment marked as failed");

        return ResponseEntity.ok(ApiResponse.<Map<String, String>>builder().data(data).build());
    }

    @PostMapping("/razorpay/success")
    public ResponseEntity<ApiResponse<Map<String, String>>> handlePaymentSuccess(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody Map<String, String> requestBody) {
        // Return confirmation success message
        Map<String, String> data = new HashMap<>();
        data.put("message", "Payment callback processed successfully");
        return ResponseEntity.ok(ApiResponse.<Map<String, String>>builder().data(data).build());
    }
}
