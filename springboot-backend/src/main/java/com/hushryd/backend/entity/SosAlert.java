package com.hushryd.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "sos_alerts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SosAlert {
    @Id
    @Column(name = "id", length = 255, nullable = false)
    private String id;

    @Column(name = "user_id", length = 255, nullable = false)
    private String userId;

    @Column(name = "booking_id", length = 255)
    private String bookingId;

    @Column(name = "latitude", precision = 10, scale = 8, nullable = false)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 10, scale = 8, nullable = false)
    private BigDecimal longitude;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    private String status = "active";

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
