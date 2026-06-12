package com.hushryd.backend.controller;

import com.hushryd.backend.dto.AuthRequests;
import com.hushryd.backend.dto.ApiResponse;
import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.entity.User;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.repository.UserRepository;
import com.hushryd.backend.security.UserPrincipal;
import com.hushryd.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, String>>> login(@RequestBody AuthRequests.LoginRequest request) {
        authService.login(request.getMobile());
        
        Map<String, String> data = new HashMap<>();
        data.put("message", "OTP sent successfully. Valid for 5 minutes.");
        
        ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                .data(data)
                .message("OTP sent successfully. Valid for 5 minutes.")
                .build();
                
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login/verify")
    public ResponseEntity<ApiResponse<AuthRequests.LoginResponse>> verifyOtp(@RequestBody AuthRequests.VerifyOtpRequest request) {
        AuthRequests.LoginResponse loginResponse = authService.verifyOtp(request.getMobile(), request.getOtp());
        
        ApiResponse<AuthRequests.LoginResponse> response = ApiResponse.<AuthRequests.LoginResponse>builder()
                .data(loginResponse)
                .build();
                
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Map<String, String>>> refresh(@RequestBody AuthRequests.RefreshTokenRequest request) {
        String newAccessToken = authService.refresh(request.getRefreshToken());
        
        Map<String, String> data = new HashMap<>();
        data.put("accessToken", newAccessToken);
        
        ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                .data(data)
                .build();
                
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @RequestBody(required = false) AuthRequests.LogoutRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        String token = request != null ? request.getRefreshToken() : null;
        String userId = userPrincipal != null ? userPrincipal.getId() : null;
        
        authService.logout(token, userId);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logged out successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/revoke-all-tokens")
    public ResponseEntity<Map<String, String>> revokeAllTokens(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }
        
        authService.revokeAll(userPrincipal.getId());
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "All tokens revoked successfully");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMe(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "User not found"));

        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("firstName", user.getFirstName());
        userData.put("lastName", user.getLastName());
        userData.put("first_name", user.getFirstName());
        userData.put("last_name", user.getLastName());
        userData.put("mobile", user.getMobile());
        userData.put("email", user.getEmail());
        userData.put("role", user.getRole());
        userData.put("profileCompleted", user.getProfileCompleted());
        userData.put("isPhoneVerified", user.getIsPhoneVerified());
        userData.put("profile_photo_url", user.getProfilePhotoUrl());
        userData.put("driver", null);
        userData.put("customer", null);
        userData.put("admin", null);

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("user", userData);

        ApiResponse<Map<String, Object>> response = ApiResponse.<Map<String, Object>>builder()
                .data(responseData)
                .build();

        return ResponseEntity.ok(response);
    }
}
