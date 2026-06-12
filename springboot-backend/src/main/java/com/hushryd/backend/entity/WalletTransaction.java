package com.hushryd.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "wallet_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletTransaction {
    @Id
    @Column(name = "id", length = 255, nullable = false)
    private String id;

    @Column(name = "customer_id", length = 255, nullable = false)
    private String customerId;

    @Column(name = "amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "type", length = 50, nullable = false)
    private String type;

    @Column(name = "transaction_type", length = 50, nullable = false)
    private String transactionType;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "booking_id", length = 255)
    private String bookingId;

    @Column(name = "subscription_id", length = 255)
    private String subscriptionId;

    @Column(name = "referral_id", length = 255)
    private String referralId;

    @Column(name = "valid_till")
    private LocalDateTime validTill;

    @Column(name = "is_expired", nullable = false)
    @Builder.Default
    private Boolean isExpired = false;

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
