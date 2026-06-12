package com.hushryd.backend.service;

import com.hushryd.backend.entity.Notification;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.repository.NotificationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public Map<String, Object> getUserNotifications(String userId, int page, int limit, boolean unreadOnly) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Notification> notificationPage;

        if (unreadOnly) {
            notificationPage = notificationRepository.findByUserIdAndRead(userId, false, pageable);
        } else {
            notificationPage = notificationRepository.findByUserId(userId, pageable);
        }

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", page);
        pagination.put("limit", limit);
        pagination.put("total", notificationPage.getTotalElements());
        pagination.put("totalPages", notificationPage.getTotalPages());

        Map<String, Object> response = new HashMap<>();
        response.put("notifications", notificationPage.getContent());
        response.put("pagination", pagination);
        return response;
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndRead(userId, false);
    }

    @Transactional
    public Notification markAsRead(String userId, String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Notification not found"));

        if (!notification.getUserId().equals(userId)) {
            throw new ApiException(ErrorCode.AUTH_FORBIDDEN, "Not authorized to access this notification");
        }

        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(String userId) {
        notificationRepository.markAllAsReadForUser(userId);
    }

    @Transactional
    public Notification createNotification(String userId, String type, String title, String message, String relatedId, String metadata) {
        Notification notification = Notification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .message(message)
                .relatedId(relatedId)
                .metadata(metadata)
                .read(false)
                .build();
        return notificationRepository.save(notification);
    }
}
