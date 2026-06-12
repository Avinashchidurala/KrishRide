package com.hushryd.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hushryd.backend.dto.DriverRequests;
import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.entity.*;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.repository.*;
import com.hushryd.backend.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class DriverService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private DriverVerificationRepository driverVerificationRepository;

    @Autowired
    private EmergencyContactRepository emergencyContactRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PayoutRepository payoutRepository;

    @Autowired
    private OtpService otpService;

    @Autowired
    private CloudinaryService cloudinaryService;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    // Pattern for IFSC code validation
    private static final Pattern IFSC_PATTERN = Pattern.compile("^[A-Z]{4}0[A-Z0-9]{6}$");
    // Pattern for PAN card validation
    private static final Pattern PAN_PATTERN = Pattern.compile("^[A-Z]{5}[0-9]{4}[A-Z]{1}$");

    public void signup(DriverRequests.SignupRequest request) {
        if (!request.isAgreeTerms()) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Must agree to Terms & Conditions");
        }

        if (request.getMobile() == null || request.getMobile().replaceAll("\\D", "").length() != 10) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Invalid mobile number. Must be 10 digits.");
        }

        if (request.getFirstName() == null || request.getFirstName().trim().isEmpty() ||
            request.getLastName() == null || request.getLastName().trim().isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "First name and last name are required");
        }

        String cleanMobile = request.getMobile().replaceAll("\\D", "");
        String formattedMobile = "+91" + cleanMobile;

        Optional<User> existingUser = userRepository.findByMobile(formattedMobile);
        if (existingUser.isPresent()) {
            throw new ApiException(ErrorCode.USER_ALREADY_EXISTS, "Mobile number is already registered");
        }

        boolean otpSent = otpService.sendOTP(request.getMobile());
        if (!otpSent) {
            throw new ApiException(ErrorCode.AUTH_OTP_NOT_SENT, "Failed to send OTP.");
        }
    }

    @Transactional
    public DriverRequests.SignupResponse signupVerify(DriverRequests.SignupVerifyRequest request) {
        if (request.getMobile() == null || request.getOtp() == null) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Mobile number and OTP are required");
        }

        String cleanMobile = request.getMobile().replaceAll("\\D", "");
        String formattedMobile = "+91" + cleanMobile;

        otpService.verifyOTP(cleanMobile, request.getOtp());

        Optional<User> existingUser = userRepository.findByMobile(formattedMobile);
        if (existingUser.isPresent()) {
            throw new ApiException(ErrorCode.USER_ALREADY_EXISTS, "Mobile number is already registered");
        }

        User user = User.builder()
                .id(UUID.randomUUID().toString())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .mobile(formattedMobile)
                .email(request.getEmail() != null && !request.getEmail().trim().isEmpty() ? request.getEmail().trim() : null)
                .gender(request.getGender() != null && !request.getGender().trim().isEmpty() ? request.getGender().trim() : null)
                .age(25)
                .role("driver")
                .isPhoneVerified(true)
                .profileCompleted(false)
                .authProvider("otp")
                .build();
        user = userRepository.save(user);

        Driver driver = Driver.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .isDriverApproved(false)
                .totalRides(0)
                .completedRides(0)
                .totalEarnings(BigDecimal.ZERO)
                .walletBalance(BigDecimal.ZERO)
                .averageRating(BigDecimal.ZERO)
                .totalRatings(0)
                .kycStatus("pending")
                .build();
        driver = driverRepository.save(driver);

        if (request.getEmergencyContactName() != null && request.getEmergencyContactMobile() != null 
                && !request.getEmergencyContactName().trim().isEmpty() && !request.getEmergencyContactMobile().trim().isEmpty()) {
            
            String cleanEmergency = request.getEmergencyContactMobile().replaceAll("\\D", "");
            String formattedEmergency = "+91" + cleanEmergency;

            EmergencyContact contact = EmergencyContact.builder()
                    .id(UUID.randomUUID().toString())
                    .userId(user.getId())
                    .name(request.getEmergencyContactName().trim())
                    .mobile(formattedEmergency)
                    .isPrimary(true)
                    .build();
            emergencyContactRepository.save(contact);
        }

        // Generate token pair (access + refresh)
        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getRole(), user.getMobile());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId(), user.getRole(), user.getMobile());

        String hashedToken = AuthService.hashRefreshToken(refreshToken);
        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .user(user)
                .token(hashedToken)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshTokenEntity);

        return DriverRequests.SignupResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(DriverRequests.SignupUserDto.builder()
                        .id(user.getId())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .mobile(user.getMobile())
                        .role(user.getRole())
                        .build())
                .driver(DriverRequests.SignupDriverDto.builder()
                        .id(driver.getId())
                        .kycStatus(driver.getKycStatus())
                        .build())
                .message("Driver account created. Please complete KYC to publish rides.")
                .build();
    }

    @Transactional
    public Map<String, Object> submitKyc(String userId, DriverRequests.KycRequest request) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "Driver profile not found"));

        // Upload documents to Cloudinary if provided as base64
        String finalAadharUrl = request.getAadharUrl();
        String finalPanUrl = request.getPanUrl();
        String finalDrivingLicenseUrl = request.getDrivingLicenseUrl();
        String finalSelfieUrl = request.getSelfieUrl();

        try {
            if (request.getAadharPhoto() != null && isBase64(request.getAadharPhoto())) {
                finalAadharUrl = cloudinaryService.uploadBase64(request.getAadharPhoto(), "kyc/" + userId, "aadhar.jpg");
            }
            if (request.getPanPhoto() != null && isBase64(request.getPanPhoto())) {
                finalPanUrl = cloudinaryService.uploadBase64(request.getPanPhoto(), "kyc/" + userId, "pan.jpg");
            }
            if (request.getDrivingLicensePhoto() != null && isBase64(request.getDrivingLicensePhoto())) {
                finalDrivingLicenseUrl = cloudinaryService.uploadBase64(request.getDrivingLicensePhoto(), "kyc/" + userId, "driving_license.jpg");
            }
            if (request.getSelfiePhoto() != null && isBase64(request.getSelfiePhoto())) {
                finalSelfieUrl = cloudinaryService.uploadBase64(request.getSelfiePhoto(), "kyc/" + userId, "selfie.jpg");
            }
        } catch (IOException e) {
            throw new ApiException(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to upload KYC documents to Cloudinary: " + e.getMessage());
        }

        // Basic validation
        if (request.getAadharNumber() == null && request.getPanNumber() == null) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Either Aadhar number or PAN number is required");
        }

        if (request.getAadharNumber() != null && finalAadharUrl == null) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Aadhar document image is required if Aadhar number is provided");
        }

        if (request.getPanNumber() != null && finalPanUrl == null) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "PAN document image is required if PAN number is provided");
        }

        if (request.getDrivingLicenseNumber() == null || finalDrivingLicenseUrl == null) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Driving license number and document image are required");
        }

        if (finalSelfieUrl == null) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Selfie photo is required");
        }

        if (request.getBankName() == null || request.getBankIfscCode() == null || request.getBankAccountNumber() == null) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Bank details (name, IFSC code, account number) are required");
        }

        // Validate formats
        String cleanIfsc = request.getBankIfscCode().replace(" ", "").toUpperCase();
        if (!IFSC_PATTERN.matcher(cleanIfsc).matches()) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Invalid IFSC code format (e.g. SBIN0001234)");
        }

        String cleanAadhar = request.getAadharNumber() != null ? request.getAadharNumber().replace(" ", "") : null;
        if (cleanAadhar != null && !cleanAadhar.matches("^\\d{12}$")) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Invalid Aadhar number. Must be 12 digits.");
        }

        String cleanPan = request.getPanNumber() != null ? request.getPanNumber().replace(" ", "").toUpperCase() : null;
        if (cleanPan != null && !PAN_PATTERN.matcher(cleanPan).matches()) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Invalid PAN number format (e.g. ABCDE1234F)");
        }

        String cleanLicense = request.getDrivingLicenseNumber().replace(" ", "");
        if (cleanLicense.length() < 10) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Invalid driving license number");
        }

        LocalDateTime expiry = null;
        if (request.getDrivingLicenseExpiry() != null) {
            expiry = LocalDateTime.parse(request.getDrivingLicenseExpiry().substring(0, 19));
            if (expiry.isBefore(LocalDateTime.now())) {
                throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Driving license must not be expired");
            }
        }

        // Prepare KYC document JSON
        Map<String, String> kycDocMap = new HashMap<>();
        kycDocMap.put("aadhar", finalAadharUrl);
        kycDocMap.put("pan", finalPanUrl);
        kycDocMap.put("drivingLicense", finalDrivingLicenseUrl);
        kycDocMap.put("selfie", finalSelfieUrl);

        String kycJson = null;
        try {
            kycJson = objectMapper.writeValueAsString(kycDocMap);
        } catch (JsonProcessingException e) {
            // Ignored
        }

        // Update driver
        driver.setAadharNumber(cleanAadhar);
        driver.setPanNumber(cleanPan);
        driver.setLicenseNumber(cleanLicense);
        driver.setLicenseExpiry(expiry);
        driver.setSelfieUrl(finalSelfieUrl);
        driver.setBankName(request.getBankName());
        driver.setBankIfscCode(cleanIfsc);
        driver.setBankAccountNumber(request.getBankAccountNumber().replace(" ", ""));
        driver.setKycDocuments(kycJson);
        driver.setKycStatus("pending");
        driver.setKycSubmittedAt(LocalDateTime.now());
        driverRepository.save(driver);

        // Delete existing verification records and create new ones
        driverVerificationRepository.deleteByDriverId(driver.getId());

        if (cleanAadhar != null && finalAadharUrl != null) {
            driverVerificationRepository.save(DriverVerification.builder()
                    .driver(driver)
                    .documentType("aadhar")
                    .documentNumber(cleanAadhar)
                    .documentUrl(finalAadharUrl)
                    .status("pending")
                    .build());
        }

        if (cleanPan != null && finalPanUrl != null) {
            driverVerificationRepository.save(DriverVerification.builder()
                    .driver(driver)
                    .documentType("pan")
                    .documentNumber(cleanPan)
                    .documentUrl(finalPanUrl)
                    .status("pending")
                    .build());
        }

        driverVerificationRepository.save(DriverVerification.builder()
                .driver(driver)
                .documentType("driving_license")
                .documentNumber(cleanLicense)
                .documentUrl(finalDrivingLicenseUrl)
                .status("pending")
                .expiresAt(expiry)
                .build());

        Map<String, Object> result = new HashMap<>();
        result.put("message", "KYC documents submitted successfully. Verification will take 1-2 hours.");
        result.put("kycStatus", "pending");
        result.put("verificationPending", true);
        result.put("estimatedTime", "1-2 hours");
        return result;
    }

    public Map<String, Object> getKycStatus(String userId) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "Driver profile not found"));

        boolean pending = "pending".equals(driver.getKycStatus()) && driver.getKycSubmittedAt() != null
                && driver.getKycSubmittedAt().plusHours(2).isAfter(LocalDateTime.now());

        boolean isExpired = driver.getKycExpiresAt() != null && driver.getKycExpiresAt().isBefore(LocalDateTime.now());
        String status = "approved".equals(driver.getKycStatus()) && isExpired ? "expired" : driver.getKycStatus();

        List<DriverVerification> verifications = driverVerificationRepository.findByDriverId(driver.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("kycStatus", status);
        response.put("verificationPending", pending);
        response.put("kycVerifiedAt", driver.getKycVerifiedAt());
        response.put("kycExpiresAt", driver.getKycExpiresAt());
        response.put("kycSubmittedAt", driver.getKycSubmittedAt());
        response.put("estimatedTime", pending ? "1-2 hours" : null);
        response.put("documents", verifications);
        response.put("isExpired", isExpired);
        return response;
    }

    @Transactional
    public Vehicle addVehicle(String userId, DriverRequests.AddVehicleRequest request) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "Driver profile not found"));

        if (request.getModel() == null || request.getModel().trim().isEmpty() ||
            request.getColor() == null || request.getColor().trim().isEmpty() ||
            request.getPlateNumber() == null || request.getPlateNumber().trim().isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Model, color, and plate number are required");
        }

        String cleanPlate = request.getPlateNumber().replace(" ", "").toUpperCase();
        if (cleanPlate.length() < 8 || cleanPlate.length() > 15) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Invalid plate number format. Must be 8-15 characters.");
        }

        // Support both old format (photos) and new format (insidePhotos/outsidePhotos)
        List<String> inside = request.getInsidePhotos() != null ? request.getInsidePhotos() : new ArrayList<>();
        List<String> outside = request.getOutsidePhotos() != null ? request.getOutsidePhotos() : new ArrayList<>();

        if (inside.isEmpty() && outside.isEmpty() && request.getPhotos() != null) {
            List<String> photos = request.getPhotos();
            outside = photos.subList(0, Math.min(2, photos.size()));
            if (photos.size() > 2) {
                inside = photos.subList(2, photos.size());
            }
        }

        if (inside.size() > 4) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Maximum 4 inside photos allowed");
        }
        if (outside.size() > 4) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Maximum 4 outside photos allowed");
        }
        if (inside.isEmpty() && outside.isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "At least one photo is required");
        }

        String insideJson = null;
        String outsideJson = null;
        try {
            insideJson = objectMapper.writeValueAsString(inside);
            outsideJson = objectMapper.writeValueAsString(outside);
        } catch (JsonProcessingException e) {
            // Ignored
        }

        Vehicle vehicle = Vehicle.builder()
                .driver(driver)
                .vehicleModel(request.getModel().trim())
                .vehicleColor(request.getColor().trim())
                .vehiclePlateNumber(cleanPlate)
                .vehicleRegistrationDocument(request.getRegistrationDocument())
                .insidePhotos(insideJson)
                .outsidePhotos(outsideJson)
                .isActive(true)
                .build();

        return vehicleRepository.save(vehicle);
    }

    public List<Vehicle> getVehicles(String userId) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "Driver profile not found"));
        return vehicleRepository.findByDriverId(driver.getId());
    }

    @Transactional
    public Vehicle updateVehicle(String userId, String vehicleId, DriverRequests.AddVehicleRequest request) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "Driver profile not found"));

        Vehicle vehicle = vehicleRepository.findByIdAndDriverId(vehicleId, driver.getId())
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Vehicle not found"));

        if (request.getModel() != null && !request.getModel().trim().isEmpty()) {
            vehicle.setVehicleModel(request.getModel().trim());
        }
        if (request.getColor() != null && !request.getColor().trim().isEmpty()) {
            vehicle.setVehicleColor(request.getColor().trim());
        }
        if (request.getPlateNumber() != null) {
            String cleanPlate = request.getPlateNumber().replace(" ", "").toUpperCase();
            if (cleanPlate.length() < 8 || cleanPlate.length() > 15) {
                throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Invalid plate number format");
            }
            vehicle.setVehiclePlateNumber(cleanPlate);
        }
        if (request.getRegistrationDocument() != null) {
            vehicle.setVehicleRegistrationDocument(request.getRegistrationDocument());
        }

        List<String> inside = request.getInsidePhotos();
        List<String> outside = request.getOutsidePhotos();

        if (inside != null || outside != null) {
            if (inside == null) inside = new ArrayList<>();
            if (outside == null) outside = new ArrayList<>();

            if (inside.size() > 4) throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Maximum 4 inside photos allowed");
            if (outside.size() > 4) throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Maximum 4 outside photos allowed");

            try {
                if (!inside.isEmpty()) vehicle.setInsidePhotos(objectMapper.writeValueAsString(inside));
                if (!outside.isEmpty()) vehicle.setOutsidePhotos(objectMapper.writeValueAsString(outside));
            } catch (JsonProcessingException e) {
                // Ignored
            }
        }

        return vehicleRepository.save(vehicle);
    }

    @Transactional
    public Vehicle activateVehicle(String userId, String vehicleId) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "Driver profile not found"));

        Vehicle vehicle = vehicleRepository.findByIdAndDriverId(vehicleId, driver.getId())
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Vehicle not found"));

        // Deactivate all vehicles for this driver first
        List<Vehicle> vehicles = vehicleRepository.findByDriverId(driver.getId());
        for (Vehicle v : vehicles) {
            v.setIsActive(false);
            vehicleRepository.save(v);
        }

        // Activate selected vehicle
        vehicle.setIsActive(true);
        return vehicleRepository.save(vehicle);
    }

    @Transactional
    public void deleteVehicle(String userId, String vehicleId) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "Driver profile not found"));

        Vehicle vehicle = vehicleRepository.findByIdAndDriverId(vehicleId, driver.getId())
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Vehicle not found"));

        // Check if active bookings exist (simplification: let's allow delete if not active, or implement constraint check)
        vehicleRepository.delete(vehicle);
    }

    public Map<String, Object> getProfile(String userId) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "Driver profile not found"));

        boolean pending = "pending".equals(driver.getKycStatus()) && driver.getKycSubmittedAt() != null
                && driver.getKycSubmittedAt().plusHours(2).isAfter(LocalDateTime.now());

        List<Vehicle> vehicles = vehicleRepository.findByDriverId(driver.getId());
        List<EmergencyContact> contacts = emergencyContactRepository.findByUserId(userId);

        Map<String, Object> userData = new HashMap<>();
        userData.put("firstName", driver.getUser().getFirstName());
        userData.put("lastName", driver.getUser().getLastName());
        userData.put("mobile", driver.getUser().getMobile());
        userData.put("email", driver.getUser().getEmail());
        userData.put("gender", driver.getUser().getGender());
        userData.put("emergencyContacts", contacts);

        Map<String, Object> driverData = new HashMap<>();
        driverData.put("id", driver.getId());
        driverData.put("isDriverApproved", driver.getIsDriverApproved());
        driverData.put("licenseNumber", driver.getLicenseNumber());
        driverData.put("licenseExpiry", driver.getLicenseExpiry());
        driverData.put("totalRides", driver.getTotalRides());
        driverData.put("completedRides", driver.getCompletedRides());
        driverData.put("totalEarnings", driver.getTotalEarnings());
        driverData.put("walletBalance", driver.getWalletBalance());
        driverData.put("averageRating", driver.getAverageRating());
        driverData.put("totalRatings", driver.getTotalRatings());
        driverData.put("bankName", driver.getBankName());
        driverData.put("bankIfscCode", driver.getBankIfscCode());
        driverData.put("bankAccountNumber", driver.getBankAccountNumber());
        driverData.put("aadharNumber", driver.getAadharNumber());
        driverData.put("panNumber", driver.getPanNumber());
        driverData.put("kycDocuments", driver.getKycDocuments());
        driverData.put("selfieUrl", driver.getSelfieUrl());
        driverData.put("kycStatus", driver.getKycStatus());
        driverData.put("verificationPending", pending);
        driverData.put("vehicles", vehicles);
        driverData.put("user", userData);

        Map<String, Object> response = new HashMap<>();
        response.put("driver", driverData);
        return response;
    }

    @Transactional
    public User updateProfile(String userId, DriverRequests.SignupRequest request) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "Driver profile not found"));

        User user = driver.getUser();
        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getGender() != null && !request.getGender().isEmpty()) user.setGender(request.getGender());
        userRepository.save(user);

        if (request.getEmergencyContactName() != null && request.getEmergencyContactMobile() != null) {
            String cleanEmergency = request.getEmergencyContactMobile().replaceAll("\\D", "");
            String formattedEmergency = "+91" + cleanEmergency;

            Optional<EmergencyContact> contactOpt = emergencyContactRepository.findByUserIdAndIsPrimary(userId, true);
            if (contactOpt.isPresent()) {
                EmergencyContact contact = contactOpt.get();
                contact.setName(request.getEmergencyContactName());
                contact.setMobile(formattedEmergency);
                emergencyContactRepository.save(contact);
            } else {
                emergencyContactRepository.save(EmergencyContact.builder()
                        .userId(userId)
                        .name(request.getEmergencyContactName())
                        .mobile(formattedEmergency)
                        .isPrimary(true)
                        .build());
            }
        }

        return user;
    }

    public Map<String, Object> getDashboardStats(String userId) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "Driver profile not found"));

        BigDecimal completedPayouts = payoutRepository.sumAmountByDriverIdAndStatus(driver.getId(), "completed");
        if (completedPayouts == null) {
            completedPayouts = BigDecimal.ZERO;
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRides", driver.getTotalRides() != null ? driver.getTotalRides() : 0);
        stats.put("totalEarnings", completedPayouts.doubleValue());
        stats.put("totalBookings", driver.getCompletedRides() != null ? driver.getCompletedRides() : 0); // fallback or sum
        stats.put("averageRating", driver.getAverageRating() != null ? driver.getAverageRating().doubleValue() : 0.0);
        stats.put("totalRatings", driver.getTotalRatings() != null ? driver.getTotalRatings() : 0);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("stats", stats);
        return response;
    }

    private boolean isBase64(String str) {
        if (str == null) return false;
        if (str.startsWith("data:")) return true;
        if (str.length() < 100) return false;
        return str.matches("^[A-Za-z0-9+/=]+$");
    }
}
