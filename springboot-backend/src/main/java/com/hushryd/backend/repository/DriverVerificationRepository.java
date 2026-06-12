package com.hushryd.backend.repository;

import com.hushryd.backend.entity.DriverVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DriverVerificationRepository extends JpaRepository<DriverVerification, String> {
    List<DriverVerification> findByDriverId(String driverId);
    List<DriverVerification> findByStatus(String status);
    void deleteByDriverId(String driverId);
}
