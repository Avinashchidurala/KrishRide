package com.hushryd.backend.service;

import com.hushryd.backend.entity.*;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
public class ChatService {

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public Map<String, Object> createOrGetSession(String userId, String userRole) {
        if (!"customer".equalsIgnoreCase(userRole)) {
            throw new ApiException(ErrorCode.AUTH_FORBIDDEN, "Only customers can create chat sessions");
        }

        Optional<ChatSession> activeSessionOpt = chatSessionRepository
                .findFirstByCustomerIdAndStatusOrderByCreatedAtDesc(userId, "active");

        Map<String, Object> response = new HashMap<>();

        if (activeSessionOpt.isPresent()) {
            ChatSession session = activeSessionOpt.get();
            List<ChatMessage> messages = chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(session.getId());
            response.put("session", session);
            response.put("messages", messages);
            return response;
        }

        ChatSession newSession = ChatSession.builder()
                .customerId(userId)
                .status("active")
                .lastMessageAt(LocalDateTime.now())
                .build();

        newSession = chatSessionRepository.save(newSession);

        response.put("session", newSession);
        response.put("messages", new ArrayList<>());
        return response;
    }

    public Map<String, Object> getSessionWithMessages(String userId, String userRole, String sessionId) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Chat session not found"));

        boolean isCustomer = session.getCustomerId().equals(userId);
        boolean isAdmin = "admin".equalsIgnoreCase(userRole);

        if (!isCustomer && !isAdmin) {
            throw new ApiException(ErrorCode.AUTH_FORBIDDEN, "Not authorized to view this chat");
        }

        List<ChatMessage> messages = chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);

        Map<String, Object> response = new HashMap<>();
        response.put("session", session);
        response.put("messages", messages);
        return response;
    }

    public Map<String, Object> getSessions(int page, int limit, String status) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "lastMessageAt"));
        Page<ChatSession> sessionPage;

        if (status != null && !"all".equalsIgnoreCase(status)) {
            sessionPage = chatSessionRepository.findByStatus(status, pageable);
        } else {
            sessionPage = chatSessionRepository.findAll(pageable);
        }

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", page);
        pagination.put("limit", limit);
        pagination.put("total", sessionPage.getTotalElements());
        pagination.put("totalPages", sessionPage.getTotalPages());

        Map<String, Object> response = new HashMap<>();
        response.put("sessions", sessionPage.getContent());
        response.put("pagination", pagination);
        return response;
    }

    @Transactional
    public ChatSession closeSession(String sessionId) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Chat session not found"));

        session.setStatus("closed");
        session.setUpdatedAt(LocalDateTime.now());
        return chatSessionRepository.save(session);
    }

    @Transactional
    public void markMessagesAsRead(String sessionId, String userId) {
        chatMessageRepository.markMessagesAsRead(sessionId, userId);
    }

    @Transactional
    public ChatMessage saveMessage(String sessionId, String senderId, String messageContent) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Chat session not found"));

        ChatMessage message = ChatMessage.builder()
                .sessionId(sessionId)
                .senderId(senderId)
                .message(messageContent)
                .isRead(false)
                .build();

        message = chatMessageRepository.save(message);

        // Update last message timestamp in session
        session.setLastMessageAt(LocalDateTime.now());
        chatSessionRepository.save(session);

        return message;
    }
}
