package com.hushryd.backend.controller;

import com.hushryd.backend.dto.ApiResponse;
import com.hushryd.backend.dto.DriverRequests;
import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.entity.User;
import com.hushryd.backend.entity.Vehicle;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.security.UserPrincipal;
import com.hushryd.backend.service.DriverService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/drivers")
public class DriverController {

    @Autowired
    private DriverService driverService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<Map<String, String>>> signup(@RequestBody DriverRequests.SignupRequest request) {
        driverService.signup(request);
        Map<String, String> data = new HashMap<>();
        data.put("message", "OTP sent. Please verify to complete signup.");
        return ResponseEntity.ok(ApiResponse.<Map<String, String>>builder().data(data).build());
    }

    @PostMapping("/signup/verify")
    public ResponseEntity<ApiResponse<DriverRequests.SignupResponse>> signupVerify(@RequestBody DriverRequests.SignupVerifyRequest request) {
        DriverRequests.SignupResponse result = driverService.signupVerify(request);
        return ResponseEntity.ok(ApiResponse.<DriverRequests.SignupResponse>builder().data(result).build());
    }

    @PostMapping("/kyc")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitKyc(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody DriverRequests.KycRequest request) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }
        Map<String, Object> result = driverService.submitKyc(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(result).build());
    }

    @GetMapping("/kyc/status")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getKycStatus(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }
        Map<String, Object> result = driverService.getKycStatus(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(result).build());
    }

    @PostMapping("/vehicles")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addVehicle(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody DriverRequests.AddVehicleRequest request) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }
        Vehicle vehicle = driverService.addVehicle(userPrincipal.getId(), request);
        Map<String, Object> data = new HashMap<>();
        data.put("vehicle", vehicle);
        data.put("message", "Vehicle added successfully");
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @GetMapping("/vehicles")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse<Map<String, List<Vehicle>>>> getVehicles(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }
        List<Vehicle> vehicles = driverService.getVehicles(userPrincipal.getId());
        Map<String, List<Vehicle>> data = new HashMap<>();
        data.put("vehicles", vehicles);
        return ResponseEntity.ok(ApiResponse.<Map<String, List<Vehicle>>>builder().data(data).build());
    }

    @PutMapping("/vehicles/{vehicleId}")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateVehicle(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String vehicleId,
            @RequestBody DriverRequests.AddVehicleRequest request) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }
        Vehicle vehicle = driverService.updateVehicle(userPrincipal.getId(), vehicleId, request);
        Map<String, Object> data = new HashMap<>();
        data.put("vehicle", vehicle);
        data.put("message", "Vehicle updated successfully");
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @PutMapping("/vehicles/{vehicleId}/activate")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> activateVehicle(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String vehicleId) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }
        Vehicle vehicle = driverService.activateVehicle(userPrincipal.getId(), vehicleId);
        Map<String, Object> data = new HashMap<>();
        data.put("vehicle", vehicle);
        data.put("message", "Vehicle activated successfully. This will be used for new rides.");
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @DeleteMapping("/vehicles/{vehicleId}")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteVehicle(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String vehicleId) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }
        driverService.deleteVehicle(userPrincipal.getId(), vehicleId);
        Map<String, String> data = new HashMap<>();
        data.put("message", "Vehicle deleted successfully");
        return ResponseEntity.ok(ApiResponse.<Map<String, String>>builder().data(data).build());
    }

    @GetMapping("/profile")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }
        Map<String, Object> result = driverService.getProfile(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(result).build());
    }

    @PutMapping("/profile")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody DriverRequests.SignupRequest request) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }
        User user = driverService.updateProfile(userPrincipal.getId(), request);
        Map<String, Object> data = new HashMap<>();
        data.put("user", user);
        data.put("message", "Profile updated successfully");
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @GetMapping("/dashboard/stats")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<Map<String, Object>> getDashboardStats(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }
        Map<String, Object> result = driverService.getDashboardStats(userPrincipal.getId());
        return ResponseEntity.ok(result);
    }
}
