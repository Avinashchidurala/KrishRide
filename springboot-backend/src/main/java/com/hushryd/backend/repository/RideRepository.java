package com.hushryd.backend.repository;

import com.hushryd.backend.entity.Ride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RideRepository extends JpaRepository<Ride, String>, JpaSpecificationExecutor<Ride> {
    List<Ride> findByDriverId(String driverId);
    List<Ride> findByDriverIdAndStatus(String driverId, String status);
    List<Ride> findByDriverIdOrderByCreatedAtDesc(String driverId);

    @org.springframework.data.jpa.repository.Query("SELECT r FROM Ride r WHERE (:status IS NULL OR r.status = :status) AND " +
           "(:search IS NULL OR LOWER(r.startLocation) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(r.endLocation) LIKE LOWER(CONCAT('%', :search, '%')))")
    org.springframework.data.domain.Page<Ride> searchRides(
            @org.springframework.data.repository.query.Param("status") String status,
            @org.springframework.data.repository.query.Param("search") String search,
            org.springframework.data.domain.Pageable pageable);
}
