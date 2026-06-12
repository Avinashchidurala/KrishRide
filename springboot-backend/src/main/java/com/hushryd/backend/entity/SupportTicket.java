package com.hushryd.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "support_tickets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportTicket {
    @Id
    @Column(name = "id", length = 255, nullable = false)
    private String id;

    @Column(name = "user_id", length = 255)
    private String userId;

    @Column(name = "booking_id", length = 255)
    private String bookingId;

    @Column(name = "ride_id", length = 255)
    private String rideId;

    @Column(name = "subject", length = 255, nullable = false)
    private String subject;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "priority", length = 50, nullable = false)
    @Builder.Default
    private String priority = "medium";

    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    private String status = "open";

    @Column(name = "assigned_to", length = 255)
    private String assignedTo;

    @Column(name = "created_by_system", nullable = false)
    @Builder.Default
    private Boolean createdBySystem = false;

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
