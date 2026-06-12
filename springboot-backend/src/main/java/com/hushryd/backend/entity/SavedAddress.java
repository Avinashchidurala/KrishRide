package com.hushryd.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "saved_addresses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedAddress {
    @Id
    @Column(name = "id", length = 255, nullable = false)
    private String id;

    @Column(name = "user_id", length = 255)
    private String userId;

    @Column(name = "customer_id", length = 255)
    private String customerId;

    @Column(name = "address_type", length = 50, nullable = false)
    private String addressType;

    @Column(name = "address", length = 255, nullable = false)
    private String address;

    @Column(name = "latitude", precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 10, scale = 8)
    private BigDecimal longitude;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

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
