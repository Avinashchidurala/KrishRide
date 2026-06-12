package com.hushryd.backend.controller;

import com.hushryd.backend.dto.ApiResponse;
import com.hushryd.backend.dto.BookingRequests;
import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.entity.Booking;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.security.UserPrincipal;
import com.hushryd.backend.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createBooking(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody BookingRequests.CreateBookingRequest request) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        Map<String, Object> result = bookingService.createBooking(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(result).build());
    }

    @GetMapping("/my-bookings")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Map<String, List<Booking>>>> getMyBookings(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        List<Booking> bookings = bookingService.getMyBookings(userPrincipal.getId());
        Map<String, List<Booking>> data = new HashMap<>();
        data.put("bookings", bookings);

        return ResponseEntity.ok(ApiResponse.<Map<String, List<Booking>>>builder().data(data).build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBookingDetails(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String id) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        Booking booking = bookingService.getBookingDetails(userPrincipal.getId(), id);
        Map<String, Object> data = new HashMap<>();
        data.put("booking", booking);

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @PostMapping("/{id}/verify-pickup-otp")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse<Map<String, String>>> verifyPickupOtp(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String id,
            @RequestBody BookingRequests.OtpVerificationRequest request) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        bookingService.verifyPickupOtp(userPrincipal.getId(), id, request.getOtp());
        Map<String, String> data = new HashMap<>();
        data.put("message", "Pickup verified. Ride started.");

        return ResponseEntity.ok(ApiResponse.<Map<String, String>>builder().data(data).build());
    }

    @PostMapping("/{id}/verify-drop-pin")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse<Map<String, String>>> verifyDropPin(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String id,
            @RequestBody BookingRequests.OtpVerificationRequest request) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        bookingService.verifyDropPin(userPrincipal.getId(), id, request.getOtp());
        Map<String, String> data = new HashMap<>();
        data.put("message", "Drop PIN verified. Booking completed.");

        return ResponseEntity.ok(ApiResponse.<Map<String, String>>builder().data(data).build());
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Map<String, String>>> cancelBooking(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String id) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        bookingService.cancelBooking(userPrincipal.getId(), id);
        Map<String, String> data = new HashMap<>();
        data.put("message", "Booking cancelled successfully");

        return ResponseEntity.ok(ApiResponse.<Map<String, String>>builder().data(data).build());
    }
}
