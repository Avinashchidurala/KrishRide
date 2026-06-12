package com.hushryd.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "driver_verifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DriverVerification {
    @Id
    @Column(name = "id", length = 255, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private Driver driver;

    @Column(name = "document_type", length = 50, nullable = false)
    private String documentType;

    @Column(name = "document_number", length = 100)
    private String documentNumber;

    @Column(name = "document_url", columnDefinition = "TEXT")
    private String documentUrl;

    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    private String status = "pending";

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

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
