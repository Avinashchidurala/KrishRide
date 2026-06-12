package com.hushryd.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class UserRequests {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SignupRequest {
        private String firstName;
        private String lastName;
        private String mobile;
        private String email;
        private String gender;
        private String emergencyContactName;
        private String emergencyContactMobile;
        private boolean agreeTerms;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SignupVerifyRequest {
        private String firstName;
        private String lastName;
        private String mobile;
        private String email;
        private String gender;
        private String emergencyContactName;
        private String emergencyContactMobile;
        private String referralCode;
        private String otp;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SignupResponse {
        private String accessToken;
        private String refreshToken;
        private SignupUserDto user;
        private SignupCustomerDto customer;
        private String message;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SignupUserDto {
        private String id;
        private String firstName;
        private String lastName;
        private String mobile;
        private String email;
        private String role;
        private String referralCode;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SignupCustomerDto {
        private String id;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateProfileRequest {
        private String firstName;
        private String lastName;
        private String email;
        private String gender;
        private String emergencyContactName;
        private String emergencyContactMobile;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdatePhotoRequest {
        private String photoUrl;
    }
}
