package com.hushryd.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class SmsService {

    public Map<String, Object> sendSMS(String to, String message) {
        String cleanMobile = to.replaceAll("\\s", "").replaceAll("[^\\d+]", "");
        String formattedTo = cleanMobile.startsWith("+") ? cleanMobile : "+91" + cleanMobile;

        log.info("[SMS] Sending to: {}, Length: {} chars", formattedTo, message.length());
        log.info("[DEV] SMS Content:\n-------------------\nTo: {}\nMessage: {}\n-------------------", formattedTo, message);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "SMS sent (dev mode)");
        return result;
    }

    public Map<String, Object> sendWhatsApp(String to, String message, String mediaUrl) {
        String cleanMobile = to.replaceAll("\\s", "").replaceAll("[^\\d+]", "");
        String formattedTo = "whatsapp:" + (cleanMobile.startsWith("+") ? cleanMobile : "+91" + cleanMobile);

        log.info("[WhatsApp] Sending to: {}", formattedTo);
        log.info("[DEV] WhatsApp Content:\n-------------------\nTo: {}\nMedia URL: {}\nMessage: {}\n-------------------", formattedTo, mediaUrl, message);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "WhatsApp message sent (dev mode)");
        return result;
    }

    @Async
    public void sendBookingConfirmationSMS(String mobile, String bookingNumber, String pickupLocation, String dropLocation, LocalDateTime scheduledTime) {
        String timeStr = scheduledTime.format(DateTimeFormatter.ofPattern("dd-MM-yyyy hh:mm a"));
        String message = String.format("Your HushRyd booking %s is confirmed. Route: %s to %s. Date/Time: %s. Thank you!",
                bookingNumber, pickupLocation, dropLocation, timeStr);
        sendSMS(mobile, message);
    }

    @Async
    public void sendRideBookedSMS(String mobile, String bookingNumber, String pickupLocation, String dropLocation, LocalDateTime scheduledTime) {
        String timeStr = scheduledTime.format(DateTimeFormatter.ofPattern("dd-MM-yyyy hh:mm a"));
        String message = String.format("Your HushRyd ride has been booked! Booking #%s\nRoute: %s to %s\nDate/Time: %s\nPlease complete payment to confirm your booking.",
                bookingNumber, pickupLocation, dropLocation, timeStr);
        sendSMS(mobile, message);
    }

    @Async
    public void sendKYCVerifiedSMS(String mobile, String driverName, String status, String remarks) {
        String message;
        if ("approved".equalsIgnoreCase(status)) {
            message = String.format("Dear %s, Your KYC verification has been approved! You can now publish rides on HushRyd. Thank you for joining us!", driverName);
        } else {
            String rejectionReason = remarks != null && !remarks.isEmpty() ? " Reason: " + remarks : "";
            message = String.format("Dear %s, Your KYC verification has been rejected.%s Please resubmit your documents with correct information.", driverName, rejectionReason);
        }
        sendSMS(mobile, message);
    }

    @Async
    public void sendWelcomeSMS(String mobile, String userName, String userRole) {
        String message;
        if ("customer".equalsIgnoreCase(userRole)) {
            message = String.format("Welcome to HushRyd, %s! Your account has been created successfully. Start booking rides and enjoy safe, comfortable journeys. Thank you for choosing HushRyd!", userName);
        } else {
            message = String.format("Welcome to HushRyd, %s! Your driver account has been created. Complete your KYC verification to start publishing rides and earning. Thank you for joining HushRyd!", userName);
        }
        sendSMS(mobile, message);
    }

    @Async
    public void sendBookingConfirmationSMSToDriver(String mobile, String driverName, String bookingNumber, String customerName, String pickupLocation, String dropLocation, LocalDateTime scheduledTime, int passengerCount) {
        String timeStr = scheduledTime.format(DateTimeFormatter.ofPattern("dd-MM-yyyy hh:mm a"));
        String message = String.format("Dear %s, New booking confirmed! Booking #%s\nCustomer: %s\nRoute: %s to %s\nTime: %s\nPassengers: %d\nPlease arrive on time for pickup. Thank you!",
                driverName, bookingNumber, customerName, pickupLocation, dropLocation, timeStr, passengerCount);
        sendSMS(mobile, message);
    }

    @Async
    public void sendAdminCreatedUserSMS(String mobile, String userName, String userRole, String webUrl) {
        String loginUrl = webUrl != null ? webUrl : "https://hushryd.com";
        String message = String.format("Welcome to HushRyd, %s! Your %s account has been created. Login at %s/login using your phone number %s with OTP. Thank you for joining HushRyd!",
                userName, userRole.toLowerCase(), loginUrl, mobile);
        sendSMS(mobile, message);
    }
}
