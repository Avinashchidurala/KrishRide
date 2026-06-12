package com.hushryd.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "rides")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ride {
    @Id
    @Column(name = "id", length = 255, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private Driver driver;

    @Column(name = "vehicle_id", length = 255)
    private String vehicleId;

    @Column(name = "start_location", length = 255, nullable = false)
    private String startLocation;

    @Column(name = "end_location", length = 255, nullable = false)
    private String endLocation;

    @Column(name = "start_latitude", precision = 10, scale = 8)
    private BigDecimal startLatitude;

    @Column(name = "start_longitude", precision = 10, scale = 8)
    private BigDecimal startLongitude;

    @Column(name = "end_latitude", precision = 10, scale = 8)
    private BigDecimal endLatitude;

    @Column(name = "end_longitude", precision = 10, scale = 8)
    private BigDecimal endLongitude;

    @Column(name = "scheduled_time", nullable = false)
    private LocalDateTime scheduledTime;

    @Column(name = "seats_available", nullable = false)
    private Integer seatsAvailable = 1;

    @Column(name = "seats_booked", nullable = false)
    private Integer seatsBooked = 0;

    @Column(name = "base_fare", precision = 10, scale = 2, nullable = false)
    private BigDecimal baseFare;

    @Column(name = "per_km_rate", precision = 10, scale = 2, nullable = false)
    private BigDecimal perKmRate;

    @Column(name = "price_per_seat", precision = 10, scale = 2)
    private BigDecimal pricePerSeat;

    @Column(name = "total_price", precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "distance_km", precision = 10, scale = 2)
    private BigDecimal distanceKm;

    @Column(name = "status", length = 50, nullable = false)
    private String status = "active";

    @Column(name = "is_surge", nullable = false)
    private Boolean isSurge = false;

    @Column(name = "surge_multiplier", precision = 3, scale = 2)
    private BigDecimal surgeMultiplier = BigDecimal.ONE;

    @Column(name = "route_polyline", columnDefinition = "TEXT")
    private String routePolyline;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "last_active_at")
    private LocalDateTime lastActiveAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "end_city", length = 100)
    private String endCity;

    @Column(name = "end_state", length = 100)
    private String endState;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "route_buffer_km", precision = 5, scale = 2, nullable = false)
    private BigDecimal routeBufferKm = BigDecimal.valueOf(5.00);

    @Column(name = "route_distance_km", precision = 10, scale = 2)
    private BigDecimal routeDistanceKm;

    @Column(name = "route_duration_min")
    private Integer routeDurationMin;

    @Column(name = "start_city", length = 100)
    private String startCity;

    @Column(name = "start_state", length = 100)
    private String startState;

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
