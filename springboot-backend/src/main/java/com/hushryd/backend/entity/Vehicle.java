package com.hushryd.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vehicles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle {
    @Id
    @Column(name = "id", length = 255, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private Driver driver;

    @Column(name = "vehicle_make", length = 100)
    private String vehicleMake;

    @Column(name = "vehicle_model", length = 100)
    private String vehicleModel;

    @Column(name = "vehicle_year")
    private Integer vehicleYear;

    @Column(name = "vehicle_color", length = 50)
    private String vehicleColor;

    @Column(name = "vehicle_plate_number", length = 50)
    private String vehiclePlateNumber;

    @Column(name = "vehicle_registration_number", length = 100)
    private String vehicleRegistrationNumber;

    @Column(name = "vehicle_registration_document", columnDefinition = "TEXT")
    private String vehicleRegistrationDocument;

    @Column(name = "vehicle_insurance_expiry")
    private LocalDateTime vehicleInsuranceExpiry;

    @Column(name = "inside_photos", columnDefinition = "TEXT")
    private String insidePhotos;

    @Column(name = "outside_photos", columnDefinition = "TEXT")
    private String outsidePhotos;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

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
