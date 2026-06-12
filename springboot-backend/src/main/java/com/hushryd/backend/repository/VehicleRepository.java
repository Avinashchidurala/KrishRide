package com.hushryd.backend.repository;

import com.hushryd.backend.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, String> {
    List<Vehicle> findByDriverId(String driverId);
    Optional<Vehicle> findByIdAndDriverId(String id, String driverId);
    List<Vehicle> findByDriverIdAndIsActive(String driverId, Boolean isActive);
    org.springframework.data.domain.Page<Vehicle> findByIsActive(Boolean isActive, org.springframework.data.domain.Pageable pageable);
}
