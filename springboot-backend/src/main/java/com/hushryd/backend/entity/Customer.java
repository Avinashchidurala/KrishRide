package com.hushryd.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "customers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer {
    @Id
    @Column(name = "id", length = 255, nullable = false)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", unique = true, nullable = false)
    private User user;

    @Column(name = "preferences", columnDefinition = "json")
    @JdbcTypeCode(SqlTypes.JSON)
    private String preferences;

    @Column(name = "total_bookings")
    private Integer totalBookings = 0;

    @Column(name = "completed_bookings")
    private Integer completedBookings = 0;

    @Column(name = "cancelled_bookings")
    private Integer cancelledBookings = 0;

    @Column(name = "average_rating", precision = 3, scale = 2)
    private BigDecimal averageRating = BigDecimal.ZERO;

    @Column(name = "total_ratings")
    private Integer totalRatings = 0;

    @Column(name = "loyalty_points")
    private Integer loyaltyPoints = 0;

    @Column(name = "wallet_balance", precision = 10, scale = 2)
    private BigDecimal walletBalance = BigDecimal.ZERO;

    @Column(name = "drop_pin", length = 10)
    private String dropPin;

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
