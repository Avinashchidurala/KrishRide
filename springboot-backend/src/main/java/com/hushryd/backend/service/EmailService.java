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
public class EmailService {

    public Map<String, Object> sendEmail(String to, String subject, String html) {
        log.info("[Email] Sending to: {}, Subject: {}", to, subject);
        log.info("[DEV] Email Content:\n-------------------\nTo: {}\nSubject: {}\nHTML Content:\n{}\n-------------------", to, subject, html);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Email sent (dev mode)");
        return result;
    }

    @Async
    public void sendBookingConfirmationEmail(String customerEmail, String customerName, String bookingNumber, String invoiceUrl) {
        String subject = "Booking Confirmed - " + bookingNumber;
        String html = String.format(
                "<h2>Booking Confirmed!</h2>" +
                "<p>Dear %s,</p>" +
                "<p>Your ride has been booked successfully.</p>" +
                "<p><strong>Booking Number:</strong> %s</p>" +
                "<p>Please find your invoice below:</p>" +
                "<p><a href=\"%s\">Download Invoice</a></p>" +
                "<p>Thank you for choosing HushRyd!</p>",
                customerName, bookingNumber, invoiceUrl
        );
        sendEmail(customerEmail, subject, html);
    }

    @Async
    public void sendPaymentInvoiceEmail(String customerEmail, String customerName, String bookingNumber, String invoiceUrl, double amount) {
        String subject = "Payment Invoice - Booking " + bookingNumber;
        String html = String.format(
                "<h2>Payment Successful!</h2>" +
                "<p>Dear %s,</p>" +
                "<p>Your payment of ₹%.2f for booking %s has been processed successfully.</p>" +
                "<p>Please find your payment invoice below:</p>" +
                "<p><a href=\"%s\">Download Invoice</a></p>" +
                "<p>Thank you for choosing HushRyd!</p>",
                customerName, amount, bookingNumber, invoiceUrl
        );
        sendEmail(customerEmail, subject, html);
    }

    @Async
    public void sendKYCVerifiedEmail(String driverEmail, String driverName, String status, String remarks) {
        String subject = "approved".equalsIgnoreCase(status)
                ? "KYC Verification Approved - HushRyd"
                : "KYC Verification Rejected - HushRyd";

        String html = "approved".equalsIgnoreCase(status)
                ? String.format("<h2>KYC Verification Approved</h2>" +
                                "<p>Dear %s,</p>" +
                                "<p>Congratulations! Your KYC verification has been APPROVED.</p>" +
                                "<p>You can now publish rides on HushRyd and start earning!</p>" +
                                "<p>Best regards,<br>HushRyd Team</p>", driverName)
                : String.format("<h2>KYC Verification Rejected</h2>" +
                                "<p>Dear %s,</p>" +
                                "<p>We regret to inform you that your KYC verification has been REJECTED.</p>" +
                                "<p><strong>Reason:</strong> %s</p>" +
                                "<p>Please review and resubmit your KYC details.</p>" +
                                "<p>Best regards,<br>HushRyd Team</p>", driverName, remarks != null ? remarks : "Invalid documents");

        sendEmail(driverEmail, subject, html);
    }

    @Async
    public void sendWelcomeEmail(String userEmail, String userName, String userRole) {
        String subject = "Welcome to HushRyd!";
        String roleText = "customer".equalsIgnoreCase(userRole) ? "customer" : "driver";
        String html = String.format(
                "<h2>Welcome to HushRyd!</h2>" +
                "<p>Hello %s,</p>" +
                "<p>We're thrilled to have you join the HushRyd community as a %s!</p>" +
                "<p>Start your journey with us today.</p>",
                userName, roleText
        );
        sendEmail(userEmail, subject, html);
    }

    @Async
    public void sendAdminCreatedUserEmail(String userEmail, String userName, String userRole, String mobile, String webUrl) {
        String subject = "Your HushRyd Account Has Been Created";
        String loginUrl = webUrl != null ? webUrl : "https://hushryd.com";
        String html = String.format(
                "<h2>Welcome %s!</h2>" +
                "<p>Your HushRyd account has been created successfully.</p>" +
                "<p><strong>Role:</strong> %s</p>" +
                "<p><strong>Phone Number:</strong> %s</p>" +
                "<p><strong>Email:</strong> %s</p>" +
                "<p>Login at <a href=\"%s/login\">HushRyd Login</a> using your phone number with OTP.</p>",
                userName, userRole, mobile, userEmail, loginUrl
        );
        sendEmail(userEmail, subject, html);
    }

    @Async
    public void sendBookingConfirmationEmailToDriver(String driverEmail, String driverName, String bookingNumber, String customerName, String pickupLocation, String dropLocation, LocalDateTime scheduledTime, int passengerCount) {
        String subject = "New Booking Confirmed - " + bookingNumber;
        String timeStr = scheduledTime.format(DateTimeFormatter.ofPattern("dd-MM-yyyy hh:mm a"));
        String html = String.format(
                "<h2>New Booking Confirmed!</h2>" +
                "<p>Dear %s,</p>" +
                "<p>You have a new confirmed booking!</p>" +
                "<ul>" +
                "<li><strong>Booking Number:</strong> %s</li>" +
                "<li><strong>Customer:</strong> %s</li>" +
                "<li><strong>Pickup Location:</strong> %s</li>" +
                "<li><strong>Drop Location:</strong> %s</li>" +
                "<li><strong>Scheduled Time:</strong> %s</li>" +
                "<li><strong>Passengers:</strong> %d</li>" +
                "</ul>" +
                "<p>Please ensure you arrive on time for pickup. Thank you!</p>",
                driverName, bookingNumber, customerName, pickupLocation, dropLocation, timeStr, passengerCount
        );
        sendEmail(driverEmail, subject, html);
    }
}
