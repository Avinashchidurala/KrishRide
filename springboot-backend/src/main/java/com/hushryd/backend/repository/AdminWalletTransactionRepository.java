package com.hushryd.backend.repository;

import com.hushryd.backend.entity.AdminWalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminWalletTransactionRepository extends JpaRepository<AdminWalletTransaction, String> {
    List<AdminWalletTransaction> findByAdminIdOrderByCreatedAtDesc(String adminId);
    org.springframework.data.domain.Page<AdminWalletTransaction> findByAdminId(String adminId, org.springframework.data.domain.Pageable pageable);
}
