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

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class WalletService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private WalletTransactionRepository walletTransactionRepository;

    @Autowired
    private DriverWalletTransactionRepository driverWalletTransactionRepository;

    @Autowired
    private AdminWalletTransactionRepository adminWalletTransactionRepository;

    @Autowired
    private BookingRepository bookingRepository;

    public BigDecimal getWalletBalance(String userId, String role) {
        if ("customer".equalsIgnoreCase(role)) {
            Customer customer = customerRepository.findByUserId(userId)
                    .orElseThrow(() -> new ApiException(ErrorCode.CUSTOMER_NOT_FOUND, "Customer not found"));
            return customer.getWalletBalance() != null ? customer.getWalletBalance() : BigDecimal.ZERO;
        } else if ("driver".equalsIgnoreCase(role)) {
            Driver driver = driverRepository.findByUserId(userId)
                    .orElseThrow(() -> new ApiException(ErrorCode.DRIVER_NOT_FOUND, "Driver not found"));
            return driver.getWalletBalance() != null ? driver.getWalletBalance() : BigDecimal.ZERO;
        } else if ("admin".equalsIgnoreCase(role)) {
            Admin admin = adminRepository.findByUserId(userId)
                    .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Admin not found"));
            return admin.getWalletBalance() != null ? admin.getWalletBalance() : BigDecimal.ZERO;
        } else {
            throw new ApiException(ErrorCode.AUTH_FORBIDDEN, "Access denied");
        }
    }

    public Map<String, Object> getCustomerTransactions(String userId, int page, int limit) {
        Customer customer = customerRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.CUSTOMER_NOT_FOUND, "Customer not found"));

        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<WalletTransaction> transactionPage = walletTransactionRepository.findByCustomerId(customer.getId(), pageable);

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", page);
        pagination.put("limit", limit);
        pagination.put("total", transactionPage.getTotalElements());
        pagination.put("totalPages", transactionPage.getTotalPages());

        Map<String, Object> response = new HashMap<>();
        response.put("transactions", transactionPage.getContent());
        response.put("pagination", pagination);
        return response;
    }

    public Map<String, Object> getDriverTransactions(String driverId, int page, int limit) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<DriverWalletTransaction> transactionPage = driverWalletTransactionRepository.findByDriverId(driverId, pageable);

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", page);
        pagination.put("limit", limit);
        pagination.put("total", transactionPage.getTotalElements());
        pagination.put("totalPages", transactionPage.getTotalPages());

        Map<String, Object> response = new HashMap<>();
        response.put("transactions", transactionPage.getContent());
        response.put("pagination", pagination);
        return response;
    }

    public Map<String, Object> getAdminTransactions(String userId, int page, int limit) {
        Admin admin = adminRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Admin not found"));

        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AdminWalletTransaction> transactionPage = adminWalletTransactionRepository.findByAdminId(admin.getId(), pageable);

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", page);
        pagination.put("limit", limit);
        pagination.put("total", transactionPage.getTotalElements());
        pagination.put("totalPages", transactionPage.getTotalPages());

        Map<String, Object> response = new HashMap<>();
        response.put("transactions", transactionPage.getContent());
        response.put("pagination", pagination);
        return response;
    }

    @Transactional
    public void applyWalletBalance(String userId, String bookingId, BigDecimal amount) {
        if (bookingId == null || bookingId.trim().isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Valid booking ID is required");
        }

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Valid amount is required");
        }

        Customer customer = customerRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.CUSTOMER_NOT_FOUND, "Customer not found"));

        if (amount.compareTo(customer.getWalletBalance()) > 0) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Insufficient wallet balance");
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ApiException(ErrorCode.BOOKING_NOT_FOUND, "Booking not found"));

        if (!booking.getCustomer().getId().equals(customer.getId())) {
            throw new ApiException(ErrorCode.AUTH_FORBIDDEN, "Booking not found");
        }

        if (!"pending".equalsIgnoreCase(booking.getPaymentStatus())) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Booking payment already " + booking.getPaymentStatus());
        }

        // Deduct from wallet balance
        customer.setWalletBalance(customer.getWalletBalance().subtract(amount));
        customerRepository.save(customer);

        // Log transaction
        WalletTransaction transaction = WalletTransaction.builder()
                .customerId(customer.getId())
                .amount(amount)
                .type("debit")
                .transactionType("trip_payment")
                .description("Payment for booking " + booking.getBookingNumber())
                .bookingId(booking.getId())
                .build();
        walletTransactionRepository.save(transaction);

        // Update booking details
        booking.setPaymentStatus("success");
        booking.setStatus("confirmed");
        bookingRepository.save(booking);
    }
}
