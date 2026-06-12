package com.hushryd.backend.repository;

import com.hushryd.backend.entity.SupportTicket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, String> {
    Page<SupportTicket> findByUserId(String userId, Pageable pageable);
    Page<SupportTicket> findByUserIdAndStatus(String userId, String status, Pageable pageable);
    Page<SupportTicket> findByUserIdAndPriority(String userId, String priority, Pageable pageable);
    Page<SupportTicket> findByUserIdAndStatusAndPriority(String userId, String status, String priority, Pageable pageable);
    
    Page<SupportTicket> findByStatus(String status, Pageable pageable);
    Page<SupportTicket> findByPriority(String priority, Pageable pageable);
    Page<SupportTicket> findByStatusAndPriority(String status, String priority, Pageable pageable);
    Page<SupportTicket> findByAssignedTo(String assignedTo, Pageable pageable);
}
