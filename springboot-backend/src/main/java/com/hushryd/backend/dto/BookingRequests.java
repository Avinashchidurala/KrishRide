package com.hushryd.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

public class BookingRequests {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateBookingRequest {
        private String rideId;
        private Integer passengerCount;
        private Integer backSeatCount;
        private String pickupLocation;
        private String pickupLatitude;
        private String pickupLongitude;
        private String dropLocation;
        private String dropLatitude;
        private String dropLongitude;
        private Double baseFare;
        private Double platformFee;
        private Double driverFee;
        private Double totalFare;
        private String currency;
        private String paymentMethod;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OtpVerificationRequest {
        private String otp; // pickup_otp or drop_pin
    }
}
