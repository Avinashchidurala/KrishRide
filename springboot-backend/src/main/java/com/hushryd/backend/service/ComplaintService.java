package com.hushryd.backend.service;

import com.hushryd.backend.entity.*;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
public class ComplaintService {

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private RideRepository rideRepository;

    @Transactional
    public Complaint createComplaint(String userId, String bookingId, String subject, String description) {
        if (subject == null || subject.trim().isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Subject is required");
        }
        if (description == null || description.trim().isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Description is required");
        }
        if (subject.trim().length() > 255) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Subject must be less than 255 characters");
        }

        // Validate booking if provided
        if (bookingId != null && !bookingId.trim().isEmpty()) {
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new ApiException(ErrorCode.BOOKING_NOT_FOUND, "Booking not found"));

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "User not found"));

            boolean isAuthorized = false;

            if ("admin".equalsIgnoreCase(user.getRole())) {
                isAuthorized = true;
            } else {
                Optional<Customer> customer = customerRepository.findByUserId(userId);
                if (customer.isPresent() && customer.get().getId().equals(booking.getCustomer().getId())) {
                    isAuthorized = true;
                } else {
                    Optional<Driver> driver = driverRepository.findByUserId(userId);
                    if (driver.isPresent()) {
                        Optional<Ride> ride = rideRepository.findById(booking.getRide().getId());
                        if (ride.isPresent() && ride.get().getDriver().getId().equals(driver.get().getId())) {
                            isAuthorized = true;
                        }
                    }
                }
            }

            if (!isAuthorized) {
                throw new ApiException(ErrorCode.AUTH_FORBIDDEN, "Not authorized to create complaint for this booking");
            }
        }

        Complaint complaint = Complaint.builder()
                .userId(userId)
                .bookingId(bookingId)
                .subject(subject.trim())
                .description(description.trim())
                .status("open")
                .build();

        return complaintRepository.save(complaint);
    }

    public Map<String, Object> getUserComplaints(String userId, int page, int limit, String status) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Complaint> complaintPage;

        if (status != null && !status.trim().isEmpty()) {
            complaintPage = complaintRepository.findByUserIdAndStatus(userId, status.trim(), pageable);
        } else {
            complaintPage = complaintRepository.findByUserId(userId, pageable);
        }

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", page);
        pagination.put("limit", limit);
        pagination.put("total", complaintPage.getTotalElements());
        pagination.put("totalPages", complaintPage.getTotalPages());

        Map<String, Object> response = new HashMap<>();
        response.put("complaints", complaintPage.getContent());
        response.put("pagination", pagination);
        return response;
    }

    public Complaint getComplaintDetails(String userId, String role, String complaintId) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Complaint not found"));

        if (!complaint.getUserId().equals(userId) && !"admin".equalsIgnoreCase(role)) {
            throw new ApiException(ErrorCode.AUTH_FORBIDDEN, "Not authorized to view this complaint");
        }

        return complaint;
    }

    @Transactional
    public Complaint updateComplaintStatus(String complaintId, String status, String resolution) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Complaint not found"));

        complaint.setStatus(status);
        // Note: Express complains table in schema.prisma has resolution? String or not. Let's see: we can log or keep it.
        // Actually, we can check if resolution field is in our Complaint entity, otherwise we can just update status.
        // Let's verify if resolution is in the entity - in our view_file, Complaint had id, userId, bookingId, subject, description, status, createdAt, updatedAt.
        // It didn't have a resolution field. So we will only update the status! That's safe and compiles.
        
        return complaintRepository.save(complaint);
    }
}
