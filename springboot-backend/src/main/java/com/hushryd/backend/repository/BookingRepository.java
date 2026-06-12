package com.hushryd.backend.repository;

import com.hushryd.backend.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, String> {
    List<Booking> findByCustomerIdOrderByCreatedAtDesc(String customerId);
    List<Booking> findByCustomerIdAndStatus(String customerId, String status);
    List<Booking> findByRideId(String rideId);
    Optional<Booking> findByBookingNumber(String bookingNumber);
    List<Booking> findByStatusAndPaymentStatusAndCreatedAtBefore(String status, String paymentStatus, LocalDateTime dateTime);

    @org.springframework.data.jpa.repository.Query("SELECT b FROM Booking b WHERE (:status IS NULL OR b.status = :status) AND (:paymentStatus IS NULL OR b.paymentStatus = :paymentStatus)")
    org.springframework.data.domain.Page<Booking> searchBookings(
            @org.springframework.data.repository.query.Param("status") String status,
            @org.springframework.data.repository.query.Param("paymentStatus") String paymentStatus,
            org.springframework.data.domain.Pageable pageable);
}
