package com.hushryd.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "referrals")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Referral {
    @Id
    @Column(name = "id", length = 255, nullable = false)
    private String id;

    @Column(name = "referrer_id", length = 255, nullable = false)
    private String referrerId;

    @Column(name = "referee_id", length = 255, unique = true)
    private String refereeId;

    @Column(name = "referral_code", length = 50, unique = true, nullable = false)
    private String referralCode;

    @Column(name = "amount", precision = 10, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal amount = BigDecimal.valueOf(100.00);

    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    private String status = "pending";

    @Column(name = "valid_till", nullable = false)
    private LocalDateTime validTill;

    @Column(name = "credited_at")
    private LocalDateTime creditedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "user_type", length = 50, nullable = false)
    @Builder.Default
    private String userType = "customer";

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
