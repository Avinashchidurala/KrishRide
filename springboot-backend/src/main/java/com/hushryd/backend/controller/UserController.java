package com.hushryd.backend.controller;

import com.hushryd.backend.dto.ApiResponse;
import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.dto.UserRequests;
import com.hushryd.backend.entity.Customer;
import com.hushryd.backend.entity.EmergencyContact;
import com.hushryd.backend.entity.SavedAddress;
import com.hushryd.backend.entity.User;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.repository.CustomerRepository;
import com.hushryd.backend.repository.EmergencyContactRepository;
import com.hushryd.backend.repository.SavedAddressRepository;
import com.hushryd.backend.repository.UserRepository;
import com.hushryd.backend.security.UserPrincipal;
import com.hushryd.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private EmergencyContactRepository emergencyContactRepository;

    @Autowired
    private SavedAddressRepository savedAddressRepository;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<Map<String, String>>> signup(@RequestBody UserRequests.SignupRequest request) {
        userService.signup(request);
        Map<String, String> data = new HashMap<>();
        data.put("message", "OTP sent. Please verify to complete signup.");
        return ResponseEntity.ok(ApiResponse.<Map<String, String>>builder().data(data).build());
    }

    @PostMapping("/signup/verify")
    public ResponseEntity<ApiResponse<UserRequests.SignupResponse>> signupVerify(@RequestBody UserRequests.SignupVerifyRequest request) {
        UserRequests.SignupResponse result = userService.signupVerify(request);
        return ResponseEntity.ok(ApiResponse.<UserRequests.SignupResponse>builder().data(result).build());
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfile(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        String userId = userPrincipal.getId();
        String role = userPrincipal.getRole();

        Map<String, Object> profile = new HashMap<>();

        if ("customer".equals(role)) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "User not found"));
            Customer customer = customerRepository.findByUserId(userId)
                    .orElseThrow(() -> new ApiException(ErrorCode.CUSTOMER_NOT_FOUND, "Customer profile not found"));
            
            List<EmergencyContact> contacts = emergencyContactRepository.findByUserId(userId);
            List<SavedAddress> addresses = savedAddressRepository.findByUserId(userId);

            profile.put("firstName", user.getFirstName());
            profile.put("lastName", user.getLastName());
            profile.put("mobile", user.getMobile());
            profile.put("email", user.getEmail());
            profile.put("gender", user.getGender());
            profile.put("emergencyContacts", contacts);
            profile.put("savedAddresses", addresses);
            profile.put("walletBalance", customer.getWalletBalance());
            profile.put("totalBookings", customer.getTotalBookings());
            profile.put("completedBookings", customer.getCompletedBookings());
            profile.put("averageRating", customer.getAverageRating());
            profile.put("recentBookings", Collections.emptyList());
        } else if ("admin".equals(role)) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "User not found"));
            profile.put("firstName", user.getFirstName());
            profile.put("lastName", user.getLastName());
            profile.put("mobile", user.getMobile());
            profile.put("email", user.getEmail());
            profile.put("gender", user.getGender());
            profile.put("role", user.getRole());
        } else {
            throw new ApiException(ErrorCode.AUTH_FORBIDDEN, "Unauthorized to access profile");
        }

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("profile", profile);

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(responseData).build());
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody UserRequests.UpdateProfileRequest request) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        User updatedUser = userService.updateProfile(userPrincipal.getId(), userPrincipal.getRole(), request);
        
        Map<String, Object> data = new HashMap<>();
        data.put("message", "Profile updated successfully");
        data.put("user", updatedUser);

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }

    @PostMapping("/profile/photo")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProfilePhoto(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody UserRequests.UpdatePhotoRequest request) {
        if (userPrincipal == null) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthorized");
        }

        User updatedUser = userService.updateProfilePhoto(userPrincipal.getId(), request.getPhotoUrl());

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("id", updatedUser.getId());
        responseData.put("firstName", updatedUser.getFirstName());
        responseData.put("lastName", updatedUser.getLastName());
        responseData.put("profile_photo_url", updatedUser.getProfilePhotoUrl());

        Map<String, Object> data = new HashMap<>();
        data.put("message", "Profile photo updated successfully");
        data.put("user", responseData);

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder().data(data).build());
    }
}
