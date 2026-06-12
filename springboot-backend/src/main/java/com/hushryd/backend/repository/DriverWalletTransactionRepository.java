package com.hushryd.backend.repository;

import com.hushryd.backend.entity.DriverWalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DriverWalletTransactionRepository extends JpaRepository<DriverWalletTransaction, String> {
    List<DriverWalletTransaction> findByDriverIdOrderByCreatedAtDesc(String driverId);
    org.springframework.data.domain.Page<DriverWalletTransaction> findByDriverId(String driverId, org.springframework.data.domain.Pageable pageable);
}
