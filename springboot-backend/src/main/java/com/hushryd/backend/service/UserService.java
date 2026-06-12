package com.hushryd.backend.service;

import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.dto.UserRequests;
import com.hushryd.backend.entity.Customer;
import com.hushryd.backend.entity.EmergencyContact;
import com.hushryd.backend.entity.RefreshToken;
import com.hushryd.backend.entity.User;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.repository.CustomerRepository;
import com.hushryd.backend.repository.EmergencyContactRepository;
import com.hushryd.backend.repository.RefreshTokenRepository;
import com.hushryd.backend.repository.UserRepository;
import com.hushryd.backend.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private EmergencyContactRepository emergencyContactRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private OtpService otpService;

    @Autowired
    private JwtTokenProvider tokenProvider;

    public void signup(UserRequests.SignupRequest request) {
        if (!request.isAgreeTerms()) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Must agree to Terms & Conditions");
        }

        if (request.getMobile() == null || request.getMobile().replaceAll("\\D", "").length() != 10) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Invalid mobile number. Must be 10 digits.");
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
    public UserRequests.SignupResponse signupVerify(UserRequests.SignupVerifyRequest request) {
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

        String userReferralCode = "HUSH" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        User user = User.builder()
                .id(UUID.randomUUID().toString())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .mobile(formattedMobile)
                .email(request.getEmail() != null && !request.getEmail().trim().isEmpty() ? request.getEmail().trim() : null)
                .gender(request.getGender() != null && !request.getGender().trim().isEmpty() ? request.getGender().trim() : null)
                .age(25)
                .role("customer")
                .isPhoneVerified(true)
                .isActive(true)
                .profileCompleted(false)
                .authProvider("otp")
                .build();
        user = userRepository.save(user);

        Customer customer = Customer.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .build();
        customer = customerRepository.save(customer);

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

        return UserRequests.SignupResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(UserRequests.SignupUserDto.builder()
                        .id(user.getId())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .mobile(user.getMobile())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .referralCode(userReferralCode)
                        .build())
                .customer(UserRequests.SignupCustomerDto.builder()
                        .id(customer.getId())
                        .build())
                .message("User account created successfully")
                .build();
    }

    @Transactional
    public User updateProfile(String userId, String role, UserRequests.UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "User not found"));

        user.setFirstName(request.getFirstName() != null ? request.getFirstName() : user.getFirstName());
        user.setLastName(request.getLastName() != null ? request.getLastName() : user.getLastName());
        user.setEmail(request.getEmail() != null ? request.getEmail() : user.getEmail());
        user.setGender(request.getGender() != null && !request.getGender().isEmpty() ? request.getGender() : user.getGender());
        userRepository.save(user);

        if (request.getEmergencyContactName() != null && request.getEmergencyContactMobile() != null) {
            String cleanEmergency = request.getEmergencyContactMobile().replaceAll("\\D", "");
            String formattedEmergency = "+91" + cleanEmergency;

            String userClean = user.getMobile().replaceAll("\\D", "");
            if (userClean.equals(cleanEmergency)) {
                throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Emergency contact cannot be same as user mobile");
            }

            Optional<EmergencyContact> existingOpt = emergencyContactRepository.findByUserIdAndIsPrimary(userId, true);
            if (existingOpt.isPresent()) {
                EmergencyContact existing = existingOpt.get();
                existing.setName(request.getEmergencyContactName());
                existing.setMobile(formattedEmergency);
                emergencyContactRepository.save(existing);
            } else {
                EmergencyContact contact = EmergencyContact.builder()
                        .id(UUID.randomUUID().toString())
                        .userId(userId)
                        .name(request.getEmergencyContactName())
                        .mobile(formattedEmergency)
                        .isPrimary(true)
                        .build();
                emergencyContactRepository.save(contact);
            }
        }

        return user;
    }

    @Transactional
    public User updateProfilePhoto(String userId, String photoUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "User not found"));

        if (photoUrl == null || photoUrl.trim().isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Photo URL is required");
        }

        try {
            new java.net.URL(photoUrl);
        } catch (Exception e) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Invalid photo URL format");
        }

        user.setProfilePhotoUrl(photoUrl);
        return userRepository.save(user);
    }
}
