package com.hushryd.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "emergency_contacts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmergencyContact {
    @Id
    @Column(name = "id", length = 255, nullable = false)
    private String id;

    @Column(name = "user_id", length = 255, nullable = false)
    private String userId;

    @Column(name = "name", length = 255, nullable = false)
    private String name;

    @Column(name = "mobile", length = 20, nullable = false)
    private String mobile;

    @Column(name = "relationship", length = 50)
    private String relationship;

    @Column(name = "is_primary", nullable = false)
    private Boolean isPrimary = false;

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
