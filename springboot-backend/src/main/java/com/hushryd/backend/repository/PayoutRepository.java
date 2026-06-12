package com.hushryd.backend.repository;

import com.hushryd.backend.entity.Payout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PayoutRepository extends JpaRepository<Payout, String> {
    List<Payout> findByDriverId(String driverId);
    org.springframework.data.domain.Page<Payout> findByDriverId(String driverId, org.springframework.data.domain.Pageable pageable);
    org.springframework.data.domain.Page<Payout> findByStatus(String status, org.springframework.data.domain.Pageable pageable);
    org.springframework.data.domain.Page<Payout> findByDriverIdAndStatus(String driverId, String status, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT SUM(p.amount) FROM Payout p WHERE p.driverId = :driverId AND p.status = :status")
    BigDecimal sumAmountByDriverIdAndStatus(String driverId, String status);
}
