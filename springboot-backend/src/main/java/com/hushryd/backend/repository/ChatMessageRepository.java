package com.hushryd.backend.repository;

import com.hushryd.backend.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, String> {
    List<ChatMessage> findBySessionIdOrderByCreatedAtAsc(String sessionId);
    List<ChatMessage> findBySessionIdAndSenderIdNotAndIsReadFalse(String sessionId, String senderId);

    @Modifying
    @Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.sessionId = :sessionId AND m.senderId <> :userId AND m.isRead = false")
    int markMessagesAsRead(@Param("sessionId") String sessionId, @Param("userId") String userId);
}
