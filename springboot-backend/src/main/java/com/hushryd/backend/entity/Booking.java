package com.hushryd.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {
    @Id
    @Column(name = "id", length = 255, nullable = false)
    private String id;

    @Column(name = "booking_number", unique = true, nullable = false, length = 50)
    private String bookingNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ride_id", nullable = false)
    private Ride ride;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "passengerCount", nullable = false)
    private Integer passengerCount = 1;

    @Column(name = "back_seat_count", nullable = false)
    private Integer backSeatCount = 0;

    @Column(name = "pickup_location", length = 255)
    private String pickupLocation;

    @Column(name = "pickup_latitude", precision = 10, scale = 8)
    private BigDecimal pickupLatitude;

    @Column(name = "pickup_longitude", precision = 10, scale = 8)
    private BigDecimal pickupLongitude;

    @Column(name = "drop_location", length = 255)
    private String dropLocation;

    @Column(name = "drop_latitude", precision = 10, scale = 8)
    private BigDecimal dropLatitude;

    @Column(name = "drop_longitude", precision = 10, scale = 8)
    private BigDecimal dropLongitude;

    @Column(name = "base_fare", precision = 10, scale = 2, nullable = false)
    private BigDecimal baseFare;

    @Column(name = "platform_fee", precision = 10, scale = 2, nullable = false)
    private BigDecimal platformFee = BigDecimal.valueOf(10.00);

    @Column(name = "service_tax", precision = 10, scale = 2)
    private BigDecimal serviceTax;

    @Column(name = "driver_fee", precision = 10, scale = 2, nullable = false)
    private BigDecimal driverFee = BigDecimal.valueOf(20.00);

    @Column(name = "total_fare", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalFare;

    @Column(name = "currency", length = 10, nullable = false)
    private String currency = "INR";

    @Column(name = "status", length = 50, nullable = false)
    private String status = "pending";

    @Column(name = "payment_status", length = 50, nullable = false)
    private String paymentStatus = "pending";

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "utr_number", length = 100)
    private String utrNumber;

    @Column(name = "pickup_otp", length = 10)
    private String pickupOtp;

    @Column(name = "drop_pin", length = 10)
    private String dropPin;

    @Column(name = "pickup_verified", nullable = false)
    private Boolean pickupVerified = false;

    @Column(name = "drop_verified", nullable = false)
    private Boolean dropVerified = false;

    @Column(name = "invoice_url", length = 255)
    private String invoiceUrl;

    @Column(name = "invoice_sent_email", nullable = false)
    private Boolean invoiceSentEmail = false;

    @Column(name = "invoice_sent_whatsapp", nullable = false)
    private Boolean invoiceSentWhatsapp = false;

    @Column(name = "invoice_sent_sms", nullable = false)
    private Boolean invoiceSentSms = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "rating_id", length = 255)
    private String ratingId;

    @Column(name = "cancelledBy", length = 255)
    private String cancelledBy;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = java.util.UUID.randomUUID().toString();
        }
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (bookingNumber == null) {
            bookingNumber = "BK-" + System.currentTimeMillis();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
