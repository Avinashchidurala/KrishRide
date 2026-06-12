package com.hushryd.backend.service;

import com.hushryd.backend.dto.AuthRequests;
import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.entity.RefreshToken;
import com.hushryd.backend.entity.User;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.repository.RefreshTokenRepository;
import com.hushryd.backend.repository.UserRepository;
import com.hushryd.backend.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private OtpService otpService;

    @Autowired
    private JwtTokenProvider tokenProvider;

    public void login(String mobile) {
        if (mobile == null || mobile.trim().isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Mobile number is required");
        }

        String cleanMobile = mobile.replaceAll("\\D", "");
        String formattedMobile = "+91" + cleanMobile;

        Optional<User> userOpt = userRepository.findByMobile(formattedMobile);
        if (userOpt.isEmpty()) {
            throw new ApiException(ErrorCode.AUTH_USER_NOT_FOUND, "User not found. Please sign up first.");
        }

        boolean otpSent = otpService.sendOTP(cleanMobile);
        if (!otpSent) {
            throw new ApiException(ErrorCode.AUTH_OTP_NOT_SENT, "Failed to send OTP. Invalid mobile format.");
        }
    }

    @Transactional
    public AuthRequests.LoginResponse verifyOtp(String mobile, String otp) {
        if (mobile == null || otp == null) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Mobile number and OTP are required");
        }

        String cleanMobile = mobile.replaceAll("\\D", "");
        String formattedMobile = "+91" + cleanMobile;

        otpService.verifyOTP(cleanMobile, otp);

        User user = userRepository.findByMobile(formattedMobile)
                .orElseThrow(() -> new ApiException(ErrorCode.AUTH_USER_NOT_FOUND, "User not found. Please sign up first."));

        if (!user.getIsActive()) {
            throw new ApiException(ErrorCode.AUTH_USER_INACTIVE, "User account is inactive");
        }

        String role = user.getRole();
        if (!List.of("customer", "driver", "admin").contains(role)) {
            throw new ApiException(ErrorCode.AUTH_ROLE_INVALID, "Invalid user role: " + role);
        }

        user.setIsPhoneVerified(true);
        user.setLastLogin(LocalDateTime.now());
        user.setAuthProvider("otp");
        userRepository.save(user);

        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getRole(), user.getMobile());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId(), user.getRole(), user.getMobile());

        String hashedToken = hashRefreshToken(refreshToken);
        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .user(user)
                .token(hashedToken)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshTokenEntity);

        return AuthRequests.LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(AuthRequests.UserResponseUser.builder()
                        .id(user.getId())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .mobile(user.getMobile())
                        .role(user.getRole())
                        .profileCompleted(user.getProfileCompleted())
                        .isPhoneVerified(user.getIsPhoneVerified())
                        .build())
                .build();
    }

    @Transactional
    public String refresh(String refreshToken) {
        if (refreshToken == null) {
            throw new ApiException(ErrorCode.AUTH_REFRESH_TOKEN_INVALID, "Refresh token required");
        }

        if (!tokenProvider.validateToken(refreshToken)) {
            throw new ApiException(ErrorCode.AUTH_REFRESH_TOKEN_INVALID, "Invalid or expired refresh token");
        }

        Claims claims = tokenProvider.getClaimsFromToken(refreshToken);
        String userId = claims.get("userId", String.class);
        String role = claims.get("role", String.class);
        String mobile = claims.get("mobile", String.class);

        String hashedToken = hashRefreshToken(refreshToken);
        RefreshToken storedToken = refreshTokenRepository.findByToken(hashedToken)
                .orElseThrow(() -> new ApiException(ErrorCode.AUTH_REFRESH_TOKEN_EXPIRED, "Invalid or expired refresh token"));

        if (storedToken.getRevoked() || storedToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ApiException(ErrorCode.AUTH_REFRESH_TOKEN_EXPIRED, "Invalid or expired refresh token");
        }

        User user = storedToken.getUser();
        if (!user.getIsActive()) {
            revokeAllTokensForUser(user);
            throw new ApiException(ErrorCode.AUTH_USER_INACTIVE, "User account is inactive");
        }

        return tokenProvider.generateAccessToken(userId, role, mobile);
    }

    @Transactional
    public void logout(String refreshToken, String userId) {
        if (refreshToken != null) {
            String hashedToken = hashRefreshToken(refreshToken);
            Optional<RefreshToken> storedTokenOpt = refreshTokenRepository.findByToken(hashedToken);
            if (storedTokenOpt.isPresent()) {
                RefreshToken storedToken = storedTokenOpt.get();
                if (storedToken.getUser().getId().equals(userId)) {
                    storedToken.setRevoked(true);
                    storedToken.setRevokedAt(LocalDateTime.now());
                    refreshTokenRepository.save(storedToken);
                    return;
                }
            }
        }

        if (userId != null) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                revokeAllTokensForUser(user);
            }
        }
    }

    @Transactional
    public void revokeAll(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "User not found"));
        revokeAllTokensForUser(user);
    }

    private void revokeAllTokensForUser(User user) {
        List<RefreshToken> activeTokens = refreshTokenRepository.findByUserAndRevoked(user, false);
        for (RefreshToken token : activeTokens) {
            token.setRevoked(true);
            token.setRevokedAt(LocalDateTime.now());
        }
        refreshTokenRepository.saveAll(activeTokens);
    }

    public static String hashRefreshToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
