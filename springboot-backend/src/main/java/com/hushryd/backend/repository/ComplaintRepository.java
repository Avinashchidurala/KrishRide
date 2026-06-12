package com.hushryd.backend.repository;

import com.hushryd.backend.entity.Complaint;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, String> {
    Page<Complaint> findByUserId(String userId, Pageable pageable);
    Page<Complaint> findByUserIdAndStatus(String userId, String status, Pageable pageable);
    long countByUserId(String userId);
    Page<Complaint> findByStatus(String status, Pageable pageable);
}
