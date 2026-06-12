package com.hushryd.backend.service;

import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.dto.PaymentRequests;
import com.hushryd.backend.entity.Booking;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class PaymentService {

    @Autowired
    private BookingRepository bookingRepository;

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    public Map<String, Object> createOrder(PaymentRequests.CreateOrderRequest request) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Booking not found"));

        double amount = request.getAmount() != null ? request.getAmount() : booking.getTotalFare().doubleValue();

        try {
            String url = "https://api.razorpay.com/v1/orders";
            RestTemplate restTemplate = new RestTemplate();

            Map<String, Object> payload = new HashMap<>();
            payload.put("amount", Math.round(amount * 100)); // in paise
            payload.put("currency", "INR");
            payload.put("receipt", "receipt_" + booking.getId());

            String auth = keyId + ":" + keySecret;
            String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Basic " + encodedAuth);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            return response.getBody();
        } catch (Exception e) {
            throw new ApiException(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to create Razorpay order: " + e.getMessage());
        }
    }

    @Transactional
    public void verifyPayment(PaymentRequests.VerifyPaymentRequest request) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Booking not found"));

        try {
            String signatureData = request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId();
            String expectedSignature = hmacSha256(signatureData, keySecret);

            if (!expectedSignature.equals(request.getRazorpaySignature())) {
                throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Invalid payment signature");
            }

            booking.setPaymentStatus("success");
            booking.setStatus("confirmed");
            booking.setUtrNumber(request.getRazorpayPaymentId());
            bookingRepository.save(booking);

        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(ErrorCode.INTERNAL_SERVER_ERROR, "Payment signature verification failed: " + e.getMessage());
        }
    }

    @Transactional
    public void handlePaymentFailure(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Booking not found"));

        booking.setPaymentStatus("failed");
        bookingRepository.save(booking);
    }

    private String hmacSha256(String data, String secret) throws Exception {
        Mac sha256Hmac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256Hmac.init(secretKey);
        byte[] rawHmac = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));

        StringBuilder sb = new StringBuilder();
        for (byte b : rawHmac) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
