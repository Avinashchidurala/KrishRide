package com.hushryd.backend.service.scheduler;

import com.hushryd.backend.entity.Booking;
import com.hushryd.backend.entity.Customer;
import com.hushryd.backend.entity.Ride;
import com.hushryd.backend.repository.BookingRepository;
import com.hushryd.backend.repository.CustomerRepository;
import com.hushryd.backend.repository.RideRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
public class BookingCleanupScheduler {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private CustomerRepository customerRepository;

    // Runs every 1 minute
    @Scheduled(fixedRate = 60000)
    public void cleanupUnpaidBookings() {
        LocalDateTime timeoutLimit = LocalDateTime.now().minusMinutes(15);
        List<String> failedPaymentStatuses = Arrays.asList("pending", "initiated", "failed");
        
        for (String paymentStatus : failedPaymentStatuses) {
            List<Booking> unpaidBookings = bookingRepository.findByStatusAndPaymentStatusAndCreatedAtBefore(
                    "pending", paymentStatus, timeoutLimit);

            if (!unpaidBookings.isEmpty()) {
                System.out.println("[Booking Cleanup] Found " + unpaidBookings.size() + " unpaid booking(s) with status: " + paymentStatus);
                for (Booking booking : unpaidBookings) {
                    cancelBookingTransactionally(booking);
                }
            }
        }
    }

    @Transactional
    public void cancelBookingTransactionally(Booking booking) {
        try {
            booking.setStatus("cancelled");
            booking.setPaymentStatus("failed");
            bookingRepository.save(booking);

            Ride ride = booking.getRide();
            ride.setSeatsBooked(Math.max(0, ride.getSeatsBooked() - booking.getPassengerCount()));
            rideRepository.save(ride);

            Customer customer = booking.getCustomer();
            customer.setTotalBookings(Math.max(0, customer.getTotalBookings() - 1));
            customerRepository.save(customer);

            System.out.println("[Booking Cleanup] Cancelled booking " + booking.getBookingNumber() + " (unpaid for >15 minutes). Released " + booking.getPassengerCount() + " seat(s).");
        } catch (Exception e) {
            System.err.println("[Booking Cleanup] Error cancelling booking " + booking.getId() + ": " + e.getMessage());
        }
    }
}
