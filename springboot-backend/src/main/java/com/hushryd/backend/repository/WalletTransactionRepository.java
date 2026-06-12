package com.hushryd.backend.repository;

import com.hushryd.backend.entity.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, String> {
    List<WalletTransaction> findByCustomerIdOrderByCreatedAtDesc(String customerId);
    org.springframework.data.domain.Page<WalletTransaction> findByCustomerId(String customerId, org.springframework.data.domain.Pageable pageable);
}
