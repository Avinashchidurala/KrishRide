package com.hushryd.backend.repository;

import com.hushryd.backend.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {
    Page<Notification> findByUserId(String userId, Pageable pageable);
    Page<Notification> findByUserIdAndRead(String userId, boolean read, Pageable pageable);
    long countByUserIdAndRead(String userId, boolean read);
    List<Notification> findByUserIdAndReadFalse(String userId);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.userId = :userId AND n.read = false")
    int markAllAsReadForUser(@Param("userId") String userId);
}
