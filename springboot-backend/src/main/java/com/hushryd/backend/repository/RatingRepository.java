package com.hushryd.backend.repository;

import com.hushryd.backend.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RatingRepository extends JpaRepository<Rating, String> {
    Optional<Rating> findByBookingId(String bookingId);
    List<Rating> findByCustomerIdOrderByCreatedAtDesc(String customerId);
    List<Rating> findByDriverIdOrderByCreatedAtDesc(String driverId);
    long countByDriverId(String driverId);
}
