package com.hushryd.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payouts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payout {
    @Id
    @Column(name = "id", length = 255, nullable = false)
    private String id;

    @Column(name = "driver_id", length = 255, nullable = false)
    private String driverId;

    @Column(name = "amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "payout_method", length = 50, nullable = false)
    private String payoutMethod;

    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    private String status = "pending";

    @Column(name = "transaction_id", length = 255)
    private String transactionId;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

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
