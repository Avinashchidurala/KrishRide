package com.hushryd.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class AuthRequests {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        private String mobile;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VerifyOtpRequest {
        private String mobile;
        private String otp;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RefreshTokenRequest {
        private String refreshToken;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LogoutRequest {
        private String refreshToken;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LoginResponse {
        private String accessToken;
        private String refreshToken;
        private UserResponseUser user;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserResponseUser {
        private String id;
        private String firstName;
        private String lastName;
        private String mobile;
        private String role;
        private boolean profileCompleted;
        private boolean isPhoneVerified;
    }
}
