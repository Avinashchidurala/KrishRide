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

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
public class SupportTicketService {

    @Autowired
    private SupportTicketRepository supportTicketRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Transactional
    public SupportTicket createTicket(String userId, String bookingId, String rideId, String subject, String description, String priority) {
        if (subject == null || subject.trim().isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Subject is required");
        }
        if (description == null || description.trim().isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Description is required");
        }
        if (subject.trim().length() > 255) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Subject must be less than 255 characters");
        }

        String ticketPriority = "medium";
        if (priority != null && Arrays.asList("low", "medium", "high", "urgent").contains(priority.toLowerCase())) {
            ticketPriority = priority.toLowerCase();
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
                throw new ApiException(ErrorCode.AUTH_FORBIDDEN, "Not authorized to create ticket for this booking");
            }
        }

        // Validate ride if provided
        if (rideId != null && !rideId.trim().isEmpty()) {
            Ride ride = rideRepository.findById(rideId)
                    .orElseThrow(() -> new ApiException(ErrorCode.RIDE_NOT_FOUND, "Ride not found"));

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "User not found"));

            boolean isAuthorized = false;

            if ("admin".equalsIgnoreCase(user.getRole())) {
                isAuthorized = true;
            } else {
                Optional<Driver> driver = driverRepository.findByUserId(userId);
                if (driver.isPresent() && driver.get().getId().equals(ride.getDriver().getId())) {
                    isAuthorized = true;
                }
            }

            if (!isAuthorized) {
                throw new ApiException(ErrorCode.AUTH_FORBIDDEN, "Not authorized to create ticket for this ride");
            }
        }

        SupportTicket ticket = SupportTicket.builder()
                .userId(userId)
                .bookingId(bookingId)
                .rideId(rideId)
                .subject(subject.trim())
                .description(description.trim())
                .priority(ticketPriority)
                .status("open")
                .createdBySystem(false)
                .build();

        return supportTicketRepository.save(ticket);
    }

    public Map<String, Object> getUserTickets(String userId, int page, int limit, String status, String priority) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SupportTicket> ticketPage;

        boolean hasStatus = status != null && !status.trim().isEmpty();
        boolean hasPriority = priority != null && !priority.trim().isEmpty();

        if (hasStatus && hasPriority) {
            ticketPage = supportTicketRepository.findByUserIdAndStatusAndPriority(userId, status.trim(), priority.trim(), pageable);
        } else if (hasStatus) {
            ticketPage = supportTicketRepository.findByUserIdAndStatus(userId, status.trim(), pageable);
        } else if (hasPriority) {
            ticketPage = supportTicketRepository.findByUserIdAndPriority(userId, priority.trim(), pageable);
        } else {
            ticketPage = supportTicketRepository.findByUserId(userId, pageable);
        }

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", page);
        pagination.put("limit", limit);
        pagination.put("total", ticketPage.getTotalElements());
        pagination.put("totalPages", ticketPage.getTotalPages());

        Map<String, Object> response = new HashMap<>();
        response.put("tickets", ticketPage.getContent());
        response.put("pagination", pagination);
        return response;
    }

    public SupportTicket getTicketDetails(String userId, String role, String ticketId) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Support ticket not found"));

        if (!userId.equals(ticket.getUserId()) && !"admin".equalsIgnoreCase(role)) {
            throw new ApiException(ErrorCode.AUTH_FORBIDDEN, "Not authorized to view this ticket");
        }

        return ticket;
    }

    @Transactional
    public SupportTicket updateTicket(String ticketId, String status, String priority, String assignedTo) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Support ticket not found"));

        if (status != null) {
            ticket.setStatus(status);
        }
        if (priority != null) {
            ticket.setPriority(priority);
        }
        if (assignedTo != null) {
            ticket.setAssignedTo(assignedTo);
        }

        return supportTicketRepository.save(ticket);
    }
}
