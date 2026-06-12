package com.hushryd.backend.controller;

import com.hushryd.backend.dto.ApiResponse;
import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.entity.*;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.security.UserPrincipal;
import com.hushryd.backend.repository.BookingRepository;
import com.hushryd.backend.service.AdminService;
import com.hushryd.backend.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingRepository bookingRepository;

    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        Map<String, Object> stats = adminService.getDashboardStats();
        Map<String, Object> response = new HashMap<>();
        response.put("stats", stats);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(response).build());
    }

    @GetMapping("/dashboard/recent-activity")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRecentActivity() {
        Map<String, Object> activity = adminService.getRecentActivity();
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(activity).build());
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        Map<String, Object> data = adminService.getUsers(role, search, page, limit);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @GetMapping("/lists/export-users")
    public ResponseEntity<byte[]> exportUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String search) {
        byte[] csvData = adminService.exportUsersCsv(role, search);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"users.csv\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(csvData);
    }

    @GetMapping("/lists/export-bookings")
    public ResponseEntity<byte[]> exportBookings(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentStatus) {
        byte[] csvData = adminService.exportBookingsCsv(status, paymentStatus);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"bookings.csv\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(csvData);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserDetails(
            @PathVariable String id) {
        Map<String, Object> details = adminService.getUserDetails(id);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(details).build());
    }

    @PostMapping("/users")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createUser(
            @RequestBody Map<String, Object> userData) {
        User user = adminService.createUser(userData);
        Map<String, Object> response = new HashMap<>();
        response.put("user", user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<Map<String, Object>>builder().data(response).build());
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateUserStatus(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        Boolean isActive = (Boolean) body.get("isActive");
        if (isActive == null) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "isActive flag is required");
        }

        User user = adminService.updateUserStatus(id, isActive);
        Map<String, Object> response = new HashMap<>();
        response.put("user", user);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(response).build());
    }

    @GetMapping("/rides")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRides(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        Map<String, Object> data = adminService.getRides(status, search, page, limit);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @GetMapping("/rides/live")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLiveRides(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        // Live rides are started rides
        Map<String, Object> data = adminService.getRides("started", null, page, limit);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @GetMapping("/bookings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBookings(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        Map<String, Object> data = adminService.getBookings(status, paymentStatus, page, limit);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @PutMapping("/bookings/{id}/payment-status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateBookingPaymentStatus(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        String paymentStatus = (String) body.get("paymentStatus");
        if (paymentStatus == null) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "paymentStatus is required");
        }

        Booking booking = adminService.updateBookingPaymentStatus(id, paymentStatus);
        Map<String, Object> response = new HashMap<>();
        response.put("booking", booking);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(response).build());
    }

    @GetMapping("/kyc/pending")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPendingKYC() {
        List<DriverVerification> pending = adminService.getPendingKYC();
        Map<String, Object> response = new HashMap<>();
        response.put("kyc", pending);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(response).build());
    }

    @PutMapping("/kyc/{driverId}/verify")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyKYC(
            @PathVariable String driverId,
            @RequestBody Map<String, Object> body) {
        String status = (String) body.get("status");
        String remarks = (String) body.get("remarks");

        if (status == null) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "status is required");
        }

        DriverVerification verification = adminService.verifyKYC(driverId, status, remarks);
        Map<String, Object> response = new HashMap<>();
        response.put("verification", verification);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(response).build());
    }

    @GetMapping("/complaints")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getComplaints(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String status) {
        Map<String, Object> data = adminService.getComplaints(page, limit, status);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @PutMapping("/complaints/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateComplaint(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        String status = (String) body.get("status");
        if (status == null) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "status is required");
        }

        Complaint complaint = adminService.updateComplaint(id, status);
        Map<String, Object> response = new HashMap<>();
        response.put("complaint", complaint);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(response).build());
    }

    @GetMapping("/sos")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSOSAlerts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String status) {
        Map<String, Object> data = adminService.getSOSAlerts(page, limit, status);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @PutMapping("/sos/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateSOSAlertStatus(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        String status = (String) body.get("status");
        if (status == null) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "status is required");
        }

        SosAlert alert = adminService.updateSOSAlertStatus(id, status);
        Map<String, Object> response = new HashMap<>();
        response.put("sosAlert", alert);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(response).build());
    }

    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRevenue() {
        // Summary dashboard stats contains the total aggregate revenue
        Map<String, Object> stats = adminService.getDashboardStats();
        Map<String, Object> response = new HashMap<>();
        response.put("revenue", stats.get("totalRevenue"));
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(response).build());
    }

    @GetMapping("/drivers/wallet-balances")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDriversWalletBalances(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String search) {
        Map<String, Object> data = adminService.getDriversWalletBalances(page, limit, search);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @PostMapping("/payouts/create")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createPayout(
            @RequestBody Map<String, Object> body) {
        Payout payout = adminService.createPayout(body);
        Map<String, Object> response = new HashMap<>();
        response.put("payout", payout);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<Map<String, Object>>builder().data(response).build());
    }

    @GetMapping("/payouts")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPayouts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String driverId) {
        Map<String, Object> data = adminService.getPayouts(page, limit, status, driverId);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @PutMapping("/payouts/{id}/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updatePayoutStatus(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        String status = (String) body.get("status");
        String transactionId = (String) body.get("transactionId");

        if (status == null) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "status is required");
        }

        Payout payout = adminService.updatePayoutStatus(id, status, transactionId);
        Map<String, Object> response = new HashMap<>();
        response.put("payout", payout);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(response).build());
    }

    @GetMapping("/support-tickets")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSupportTickets(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String assignedTo) {
        Map<String, Object> data = adminService.getSupportTickets(page, limit, status, priority, assignedTo);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @PutMapping("/support-tickets/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateSupportTicket(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        String status = (String) body.get("status");
        String priority = (String) body.get("priority");
        String assignedTo = (String) body.get("assignedTo");

        SupportTicket ticket = adminService.updateSupportTicket(id, status, priority, assignedTo);
        Map<String, Object> response = new HashMap<>();
        response.put("ticket", ticket);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(response).build());
    }

    @GetMapping("/vehicles")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getVehicles(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive) {
        Map<String, Object> data = adminService.getVehicles(page, limit, search, isActive);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @PutMapping("/vehicles/{id}/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateVehicleStatus(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        Boolean isActive = (Boolean) body.get("isActive");
        if (isActive == null) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "isActive is required");
        }

        Vehicle vehicle = adminService.updateVehicleStatus(id, isActive);
        Map<String, Object> response = new HashMap<>();
        response.put("vehicle", vehicle);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(response).build());
    }

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAnalytics() {
        // Return summary dashboard stats as analytics
        Map<String, Object> stats = adminService.getDashboardStats();
        Map<String, Object> response = new HashMap<>();
        response.put("analytics", stats);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(response).build());
    }

    @GetMapping("/settings/surge-pricing")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSurgePricingSettings() {
        Map<String, Object> settings = adminService.getSurgePricingSettings();
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(settings).build());
    }

    @PutMapping("/settings/surge-pricing")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateSurgePricingSettings(
            @RequestBody Map<String, Object> body) {
        Map<String, Object> settings = adminService.updateSurgePricingSettings(body);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(settings).build());
    }

    @DeleteMapping("/settings/surge-pricing/city/{city}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deleteCitySurgePricingSettings(
            @PathVariable String city) {
        Map<String, Object> response = adminService.deleteCitySurgePricingSettings(city);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(response).build());
    }

    @PostMapping("/{bookingId}/cancel")
    public ResponseEntity<ApiResponse<Map<String, Object>>> adminCancelBooking(
            @PathVariable String bookingId) {
        // Fetch booking directly from repository to obtain customer userId
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ApiException(ErrorCode.BOOKING_NOT_FOUND, "Booking not found"));
        
        bookingService.cancelBooking(booking.getCustomer().getUser().getId(), bookingId);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Booking cancelled successfully by admin");
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(response).build());
    }

    @PutMapping("/profile-update/{userId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> editUserDetails(
            @PathVariable String userId,
            @RequestBody Map<String, Object> body) {
        User user = adminService.editUserDetails(userId, body);
        Map<String, Object> response = new HashMap<>();
        response.put("user", user);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(response).build());
    }

    @GetMapping("/driver-profile/{userId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDriverDetailsByUserId(
            @PathVariable String userId) {
        Driver driver = adminService.getDriverDetailsByUserId(userId);
        Map<String, Object> response = new HashMap<>();
        response.put("driver", driver);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(response).build());
    }

    @PutMapping("/update-driver-profile/{userId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateDriverDetails(
            @PathVariable String userId,
            @RequestBody Map<String, Object> body) {
        Driver driver = adminService.updateDriverDetails(userId, body);
        Map<String, Object> response = new HashMap<>();
        response.put("driver", driver);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(response).build());
    }
}
