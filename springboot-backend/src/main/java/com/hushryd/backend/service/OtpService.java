package com.hushryd.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.exception.ApiException;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private static class OtpData {
        final String otp;
        final long expiresAt;
        int attempts;

        OtpData(String otp, long expiresAt) {
            this.otp = otp;
            this.expiresAt = expiresAt;
            this.attempts = 0;
        }
    }

    private final Map<String, OtpData> otpStore = new ConcurrentHashMap<>();

    @Value("${twilio.account-sid}")
    private String twilioAccountSid;

    @Value("${twilio.auth-token}")
    private String twilioAuthToken;

    @Value("${twilio.phone-number}")
    private String twilioPhoneNumber;

    private boolean isTwilioInitialized = false;

    @PostConstruct
    public void init() {
        try {
            if (twilioAccountSid != null && !twilioAccountSid.trim().isEmpty() &&
                twilioAuthToken != null && !twilioAuthToken.trim().isEmpty()) {
                Twilio.init(twilioAccountSid, twilioAuthToken);
                isTwilioInitialized = true;
                System.out.println("[INFO] Twilio initialized successfully.");
            } else {
                System.out.println("[WARNING] Twilio credentials are empty. OTPs will default to console logging.");
            }
        } catch (Exception e) {
            System.err.println("[ERROR] Failed to initialize Twilio: " + e.getMessage());
        }
    }

    public String generateOTP() {
        return String.valueOf((int) (100000 + Math.random() * 900000));
    }

    public boolean sendOTP(String mobile) {
        String cleanMobile = mobile.replaceAll("\\D", "");
        if (cleanMobile.length() != 10) {
            return false;
        }

        String otp = generateOTP();
        long expiresAt = System.currentTimeMillis() + 5 * 60 * 1000;

        otpStore.put(cleanMobile, new OtpData(otp, expiresAt));

        boolean twilioSent = false;
        if (isTwilioInitialized) {
            try {
                String formattedMobile = "+91" + cleanMobile;
                Message.creator(
                    new PhoneNumber(formattedMobile),
                    new PhoneNumber(twilioPhoneNumber),
                    "Your HushRyd OTP is " + otp + ". It is valid for 5 minutes."
                ).create();
                twilioSent = true;
                System.out.println("[INFO] OTP sent via Twilio to " + formattedMobile);
            } catch (Exception e) {
                System.err.println("[ERROR] Twilio OTP sending failed: " + e.getMessage() + ". Falling back to console logging.");
            }
        }

        if (!twilioSent) {
            System.out.println("[DEV] OTP for +91" + cleanMobile + ": " + otp + " (expires in 5 minutes)");
        }

        return true;
    }

    public void verifyOTP(String mobile, String otp) {
        String cleanMobile = mobile.replaceAll("\\D", "");

        OtpData stored = otpStore.get(cleanMobile);
        if (stored == null) {
            throw new ApiException(ErrorCode.AUTH_OTP_INVALID, "OTP expired or not requested. Please register again.");
        }

        if (System.currentTimeMillis() > stored.expiresAt) {
            otpStore.remove(cleanMobile);
            throw new ApiException(ErrorCode.AUTH_OTP_EXPIRED, "OTP expired. Please request a new one.");
        }

        if (stored.otp.equals(otp)) {
            otpStore.remove(cleanMobile);
        } else {
            stored.attempts++;
            int remaining = 3 - stored.attempts;
            if (remaining <= 0) {
                otpStore.remove(cleanMobile);
                throw new ApiException(ErrorCode.AUTH_OTP_INVALID, "Too many failed attempts. Please register again.");
            } else {
                throw new ApiException(ErrorCode.AUTH_OTP_INVALID, "Invalid OTP. " + remaining + " attempts remaining.");
            }
        }
    }
}

