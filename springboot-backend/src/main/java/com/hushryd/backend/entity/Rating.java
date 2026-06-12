package com.hushryd.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ratings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Rating {
    @Id
    @Column(name = "id", length = 255, nullable = false)
    private String id;

    @Column(name = "booking_id", length = 255, unique = true, nullable = false)
    private String bookingId;

    @Column(name = "customer_id", length = 255, nullable = false)
    private String customerId;

    @Column(name = "driver_id", length = 255, nullable = false)
    private String driverId;

    @Column(name = "rating", nullable = false)
    private Integer rating;

    @Column(name = "review", columnDefinition = "TEXT")
    private String review;

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
