package com.hushryd.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "drivers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Driver {
    @Id
    @Column(name = "id", length = 255, nullable = false)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", unique = true, nullable = false)
    private User user;

    @Column(name = "is_driver_approved")
    private Boolean isDriverApproved = false;

    @Column(name = "license_number", length = 100)
    private String licenseNumber;

    @Column(name = "license_expiry")
    private LocalDateTime licenseExpiry;

    @Column(name = "total_rides")
    private Integer totalRides = 0;

    @Column(name = "completed_rides")
    private Integer completedRides = 0;

    @Column(name = "total_earnings", precision = 10, scale = 2)
    private BigDecimal totalEarnings = BigDecimal.ZERO;

    @Column(name = "wallet_balance", precision = 10, scale = 2)
    private BigDecimal walletBalance = BigDecimal.ZERO;

    @Column(name = "average_rating", precision = 3, scale = 2)
    private BigDecimal averageRating = BigDecimal.ZERO;

    @Column(name = "total_ratings")
    private Integer totalRatings = 0;

    @Column(name = "bank_name", length = 255)
    private String bankName;

    @Column(name = "bank_ifsc_code", length = 20)
    private String bankIfscCode;

    @Column(name = "bank_account_number", length = 50)
    private String bankAccountNumber;

    @Column(name = "aadhar_number", length = 20)
    private String aadharNumber;

    @Column(name = "pan_number", length = 20)
    private String panNumber;

    @Column(name = "kyc_documents", columnDefinition = "json")
    @JdbcTypeCode(SqlTypes.JSON)
    private String kycDocuments;

    @Column(name = "selfie_url", columnDefinition = "TEXT")
    private String selfieUrl;

    @Column(name = "kyc_verified_at")
    private LocalDateTime kycVerifiedAt;

    @Column(name = "kyc_expires_at")
    private LocalDateTime kycExpiresAt;

    @Column(name = "kyc_status", length = 50)
    private String kycStatus = "pending";

    @Column(name = "kyc_submitted_at")
    private LocalDateTime kycSubmittedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = java.util.UUID.randomUUID().toString();
        }
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
