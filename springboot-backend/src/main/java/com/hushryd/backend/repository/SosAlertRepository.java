package com.hushryd.backend.repository;

import com.hushryd.backend.entity.SosAlert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SosAlertRepository extends JpaRepository<SosAlert, String> {
    List<SosAlert> findTop10ByUserIdOrderByCreatedAtDesc(String userId);
    Page<SosAlert> findByStatus(String status, Pageable pageable);
}
