package com.hushryd.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

public class DriverRequests {

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
        private SignupDriverDto driver;
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
        private String role;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SignupDriverDto {
        private String id;
        private String kycStatus;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class KycRequest {
        private String aadharNumber;
        private String panNumber;
        private String drivingLicenseNumber;
        private String drivingLicenseExpiry; // ISO Date String
        private String selfieUrl;
        private String selfiePhoto; // base64
        private String aadharUrl;
        private String aadharPhoto; // base64
        private String panUrl;
        private String panPhoto; // base64
        private String drivingLicenseUrl;
        private String drivingLicensePhoto; // base64
        private String bankName;
        private String bankIfscCode;
        private String bankAccountNumber;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AddVehicleRequest {
        private String model;
        private String color;
        private String plateNumber;
        private List<String> photos;
        private List<String> insidePhotos;
        private List<String> outsidePhotos;
        private String registrationDocument;
    }
}
