package com.hushryd.backend.service;

import com.hushryd.backend.entity.*;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
@Slf4j
public class RatingService {

    @Autowired
    private RatingRepository ratingRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private RideRepository rideRepository;

    @Transactional
    public Map<String, Object> submitRating(String userId, String bookingId, double rating, String review) {
        if (bookingId == null || bookingId.trim().isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Valid booking ID is required");
        }

        if (rating < 1 || rating > 5) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Rating must be a number between 1 and 5");
        }

        Customer customer = customerRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.CUSTOMER_NOT_FOUND, "Customer not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ApiException(ErrorCode.BOOKING_NOT_FOUND, "Booking not found"));

        if (!booking.getCustomer().getId().equals(customer.getId())) {
            throw new ApiException(ErrorCode.AUTH_FORBIDDEN, "Not authorized to rate this booking");
        }

        if (!"completed".equalsIgnoreCase(booking.getStatus())) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Can only rate completed bookings");
        }

        Optional<Rating> existingRating = ratingRepository.findByBookingId(bookingId);
        if (existingRating.isPresent()) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "This booking has already been rated");
        }

        Ride ride = rideRepository.findById(booking.getRide().getId())
                .orElseThrow(() -> new ApiException(ErrorCode.RIDE_NOT_FOUND, "Ride not found for this booking"));

        Driver driver = driverRepository.findById(ride.getDriver().getId())
                .orElseThrow(() -> new ApiException(ErrorCode.DRIVER_NOT_FOUND, "Driver not found"));

        // Save rating record
        Rating newRating = Rating.builder()
                .bookingId(bookingId)
                .customerId(customer.getId())
                .driverId(driver.getId())
                .rating((int) Math.round(rating))
                .review(review)
                .build();

        newRating = ratingRepository.save(newRating);

        // Update driver stats
        int currentTotal = driver.getTotalRatings() != null ? driver.getTotalRatings() : 0;
        BigDecimal currentAverage = driver.getAverageRating() != null ? driver.getAverageRating() : BigDecimal.ZERO;

        int newTotal = currentTotal + 1;
        BigDecimal newAverage = currentAverage.multiply(BigDecimal.valueOf(currentTotal))
                .add(BigDecimal.valueOf(rating))
                .divide(BigDecimal.valueOf(newTotal), 2, RoundingMode.HALF_UP);

        driver.setTotalRatings(newTotal);
        driver.setAverageRating(newAverage);
        driverRepository.save(driver);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Rating submitted successfully");

        Map<String, Object> details = new HashMap<>();
        details.put("id", newRating.getId());
        details.put("bookingId", bookingId);
        details.put("rating", newRating.getRating());
        details.put("review", newRating.getReview());
        details.put("driverId", driver.getId());
        details.put("driverAverageRating", newAverage.toString());
        details.put("totalRatings", newTotal);
        response.put("rating", details);

        return response;
    }

    public Map<String, Object> getDriverRatings(String driverId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ApiException(ErrorCode.DRIVER_NOT_FOUND, "Driver not found"));

        User user = driver.getUser();

        Map<String, Object> response = new HashMap<>();
        response.put("driverId", driver.getId());
        response.put("driverName", user.getFirstName() + " " + user.getLastName());
        response.put("averageRating", driver.getAverageRating() != null ? driver.getAverageRating() : BigDecimal.ZERO);
        response.put("totalRatings", driver.getTotalRatings() != null ? driver.getTotalRatings() : 0);
        return response;
    }

    public Map<String, Object> getMyRatings(String userId) {
        Customer customer = customerRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.CUSTOMER_NOT_FOUND, "Customer not found"));

        List<Rating> ratings = ratingRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId());

        List<Map<String, Object>> list = new ArrayList<>();
        for (Rating r : ratings) {
            Map<String, Object> item = new HashMap<>();
            item.put("ratingId", r.getId());
            item.put("bookingId", r.getBookingId());

            Optional<Booking> bookingOpt = bookingRepository.findById(r.getBookingId());
            if (bookingOpt.isPresent()) {
                Booking booking = bookingOpt.get();
                item.put("bookingNumber", booking.getBookingNumber());

                Optional<Ride> rideOpt = rideRepository.findById(booking.getRide().getId());
                if (rideOpt.isPresent()) {
                    Ride ride = rideOpt.get();
                    item.put("rideRoute", ride.getStartLocation() + " → " + ride.getEndLocation());

                    Optional<Driver> driverOpt = driverRepository.findById(ride.getDriver().getId());
                    if (driverOpt.isPresent()) {
                        Driver d = driverOpt.get();
                        User u = d.getUser();
                        item.put("driverName", u.getFirstName() + " " + u.getLastName());
                        item.put("driverPhoto", u.getProfilePhotoUrl());
                    }
                }
            }

            item.put("rating", r.getRating());
            item.put("review", r.getReview());
            item.put("ratedAt", r.getCreatedAt());
            list.add(item);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("count", list.size());
        response.put("ratings", list);
        return response;
    }

    public Map<String, Object> getDriverReviews(String driverId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ApiException(ErrorCode.DRIVER_NOT_FOUND, "Driver not found"));

        User user = driver.getUser();

        List<Rating> ratings = ratingRepository.findByDriverIdOrderByCreatedAtDesc(driverId);
        // limit to 10
        if (ratings.size() > 10) {
            ratings = ratings.subList(0, 10);
        }

        List<Map<String, Object>> reviews = new ArrayList<>();
        for (Rating r : ratings) {
            Map<String, Object> review = new HashMap<>();
            review.put("rating", r.getRating());
            review.put("review", r.getReview());
            review.put("ratedAt", r.getCreatedAt());

            Optional<Booking> bookingOpt = bookingRepository.findById(r.getBookingId());
            if (bookingOpt.isPresent()) {
                review.put("bookingNumber", bookingOpt.get().getBookingNumber());
            }
            reviews.add(review);
        }

        Map<String, Object> driverInfo = new HashMap<>();
        driverInfo.put("id", driver.getId());
        driverInfo.put("name", user.getFirstName() + " " + user.getLastName());
        driverInfo.put("photo", user.getProfilePhotoUrl());
        driverInfo.put("averageRating", driver.getAverageRating() != null ? driver.getAverageRating().toString() : "0.00");
        driverInfo.put("totalRatings", driver.getTotalRatings() != null ? driver.getTotalRatings() : 0);

        Map<String, Object> response = new HashMap<>();
        response.put("driver", driverInfo);
        response.put("reviews", reviews);
        return response;
    }
}
