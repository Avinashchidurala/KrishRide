package com.hushryd.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @Column(name = "id", length = 255, nullable = false)
    private String id;

    @Column(name = "first_name", length = 255, nullable = false)
    private String firstName;

    @Column(name = "last_name", length = 255, nullable = false)
    private String lastName;

    @Column(name = "age", nullable = false)
    private Integer age;

    @Column(name = "gender", length = 50)
    private String gender;

    @Column(name = "mobile", unique = true, nullable = false, length = 20)
    private String mobile;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "is_phone_verified", nullable = false)
    @Builder.Default
    private Boolean isPhoneVerified = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "profile_completed", nullable = false)
    @Builder.Default
    private Boolean profileCompleted = false;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "role", length = 50, nullable = false)
    private String role;

    @Column(name = "profile_photo_url", columnDefinition = "TEXT")
    private String profilePhotoUrl;

    @Column(name = "auth_provider", length = 50, nullable = false)
    @Builder.Default
    private String authProvider = "otp";

    @Column(name = "provider_id", length = 255)
    private String providerId;

    @Column(name = "fcm_token", columnDefinition = "TEXT")
    private String fcmToken;

    @Column(name = "web_push_subscription", columnDefinition = "TEXT")
    private String webPushSubscription;

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
