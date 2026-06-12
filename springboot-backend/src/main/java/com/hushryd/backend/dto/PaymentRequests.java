package com.hushryd.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class PaymentRequests {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateOrderRequest {
        private String bookingId;
        private Double amount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VerifyPaymentRequest {
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private String razorpaySignature;
        private String bookingId;
    }
}
