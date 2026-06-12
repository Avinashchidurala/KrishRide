package com.hushryd.backend.repository;

import com.hushryd.backend.entity.ChatSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, String> {
    Optional<ChatSession> findFirstByCustomerIdAndStatusOrderByCreatedAtDesc(String customerId, String status);
    Page<ChatSession> findByStatus(String status, Pageable pageable);
}
