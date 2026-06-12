package com.hushryd.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@Slf4j
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private DriverVerificationRepository driverVerificationRepository;

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private SosAlertRepository sosAlertRepository;

    @Autowired
    private PayoutRepository payoutRepository;

    @Autowired
    private SupportTicketRepository supportTicketRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private DriverWalletTransactionRepository driverWalletTransactionRepository;

    @Autowired
    private AdminWalletTransactionRepository adminWalletTransactionRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private SmsService smsService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    public Map<String, Object> getDashboardStats() {
        String cacheKey = "admin:stats";
        try {
            String cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                return objectMapper.readValue(cached, Map.class);
            }
        } catch (Exception e) {
            log.error("Redis stats read error", e);
        }

        long totalUsers = userRepository.count();
        long totalDrivers = driverRepository.count();
        long totalCustomers = customerRepository.count();
        long totalRides = rideRepository.count();
        long totalBookings = bookingRepository.count();

        long activeBookings = bookingRepository.searchBookings("confirmed", null, Pageable.unpaged()).getTotalElements()
                + bookingRepository.searchBookings("started", null, Pageable.unpaged()).getTotalElements();

        long completedBookings = bookingRepository.searchBookings("completed", null, Pageable.unpaged()).getTotalElements();
        long cancelledBookings = bookingRepository.searchBookings("cancelled", null, Pageable.unpaged()).getTotalElements();

        // Calculate total revenue from successful bookings
        BigDecimal totalRevenue = BigDecimal.ZERO;
        List<Booking> successfulBookings = bookingRepository.findAll().stream()
                .filter(b -> "success".equalsIgnoreCase(b.getPaymentStatus()))
                .collect(Collectors.toList());

        for (Booking b : successfulBookings) {
            if (b.getTotalFare() != null) {
                totalRevenue = totalRevenue.add(b.getTotalFare());
            }
        }

        long pendingKYC = driverVerificationRepository.findByStatus("pending").size();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("totalDrivers", totalDrivers);
        stats.put("totalCustomers", totalCustomers);
        stats.put("totalRides", totalRides);
        stats.put("totalBookings", totalBookings);
        stats.put("activeBookings", activeBookings);
        stats.put("completedBookings", completedBookings);
        stats.put("cancelledBookings", cancelledBookings);
        stats.put("totalRevenue", totalRevenue.doubleValue());
        stats.put("pendingKYC", pendingKYC);

        try {
            redisTemplate.opsForValue().set(cacheKey, objectMapper.writeValueAsString(stats), 5, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.error("Redis stats save error", e);
        }

        return stats;
    }

    public Map<String, Object> getRecentActivity() {
        Pageable limitFive = PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<User> users = userRepository.findAll(limitFive);
        Page<Ride> rides = rideRepository.findAll(limitFive);
        Page<Booking> bookings = bookingRepository.findAll(limitFive);

        Map<String, Object> activity = new HashMap<>();
        activity.put("recentUsers", users.getContent());
        activity.put("recentRides", rides.getContent());
        activity.put("recentBookings", bookings.getContent());
        return activity;
    }

    public Map<String, Object> getUsers(String role, String search, int page, int limit) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        String roleParam = (role != null && !role.trim().isEmpty()) ? role.trim() : null;
        String searchParam = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        Page<User> userPage = userRepository.searchUsers(roleParam, searchParam, pageable);

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", page);
        pagination.put("limit", limit);
        pagination.put("total", userPage.getTotalElements());
        pagination.put("totalPages", userPage.getTotalPages());

        Map<String, Object> response = new HashMap<>();
        response.put("users", userPage.getContent());
        response.put("pagination", pagination);
        return response;
    }

    @Transactional
    public User createUser(Map<String, Object> userData) {
        String firstName = (String) userData.get("firstName");
        String lastName = (String) userData.get("lastName");
        String mobile = (String) userData.get("mobile");
        String email = (String) userData.get("email");
        String role = (String) userData.get("role");

        if (firstName == null || firstName.trim().isEmpty() ||
                lastName == null || lastName.trim().isEmpty() ||
                mobile == null || mobile.trim().isEmpty() ||
                role == null || role.trim().isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "First name, last name, mobile, and role are required");
        }

        Optional<User> existing = userRepository.findByMobile(mobile);
        if (existing.isPresent()) {
            throw new ApiException(ErrorCode.USER_ALREADY_EXISTS, "User with this mobile number already exists");
        }

        User user = User.builder()
                .firstName(firstName.trim())
                .lastName(lastName.trim())
                .mobile(mobile.trim())
                .email(email != null ? email.trim() : null)
                .role(role.trim().toLowerCase())
                .age(userData.get("age") != null ? (Integer) userData.get("age") : 25)
                .gender((String) userData.get("gender"))
                .isPhoneVerified(true)
                .isActive(true)
                .profileCompleted(true)
                .authProvider("otp")
                .build();

        user = userRepository.save(user);

        // Create related Customer or Driver record
        if ("customer".equalsIgnoreCase(role)) {
            Customer customer = Customer.builder()
                    .user(user)
                    .totalBookings(0)
                    .completedBookings(0)
                    .cancelledBookings(0)
                    .walletBalance(BigDecimal.ZERO)
                    .build();
            customerRepository.save(customer);
        } else if ("driver".equalsIgnoreCase(role)) {
            Driver driver = Driver.builder()
                    .user(user)
                    .isDriverApproved(false)
                    .kycStatus("pending")
                    .walletBalance(BigDecimal.ZERO)
                    .totalEarnings(BigDecimal.ZERO)
                    .totalRides(0)
                    .completedRides(0)
                    .build();
            driverRepository.save(driver);
        } else if ("admin".equalsIgnoreCase(role)) {
            Admin admin = Admin.builder()
                    .user(user)
                    .walletBalance(BigDecimal.ZERO)
                    .build();
            adminRepository.save(admin);
        }

        smsService.sendAdminCreatedUserSMS(user.getMobile(), user.getFirstName(), user.getRole(), "https://hushryd.com");
        if (user.getEmail() != null) {
            emailService.sendAdminCreatedUserEmail(user.getEmail(), user.getFirstName(), user.getRole(), user.getMobile(), "https://hushryd.com");
        }

        return user;
    }

    @Transactional
    public User updateUserStatus(String userId, boolean isActive) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "User not found"));
        user.setIsActive(isActive);
        return userRepository.save(user);
    }

    public Map<String, Object> getRides(String status, String search, int page, int limit) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        String statusParam = (status != null && !status.trim().isEmpty() && !"all".equalsIgnoreCase(status)) ? status.trim() : null;
        String searchParam = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        Page<Ride> ridePage = rideRepository.searchRides(statusParam, searchParam, pageable);

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", page);
        pagination.put("limit", limit);
        pagination.put("total", ridePage.getTotalElements());
        pagination.put("totalPages", ridePage.getTotalPages());

        Map<String, Object> response = new HashMap<>();
        response.put("rides", ridePage.getContent());
        response.put("pagination", pagination);
        return response;
    }

    public Map<String, Object> getBookings(String status, String paymentStatus, int page, int limit) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        String statusParam = (status != null && !status.trim().isEmpty() && !"all".equalsIgnoreCase(status)) ? status.trim() : null;
        String paymentParam = (paymentStatus != null && !paymentStatus.trim().isEmpty() && !"all".equalsIgnoreCase(paymentStatus)) ? paymentStatus.trim() : null;

        Page<Booking> bookingPage = bookingRepository.searchBookings(statusParam, paymentParam, pageable);

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", page);
        pagination.put("limit", limit);
        pagination.put("total", bookingPage.getTotalElements());
        pagination.put("totalPages", bookingPage.getTotalPages());

        Map<String, Object> response = new HashMap<>();
        response.put("bookings", bookingPage.getContent());
        response.put("pagination", pagination);
        return response;
    }

    @Transactional
    public Booking updateBookingPaymentStatus(String bookingId, String paymentStatus) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ApiException(ErrorCode.BOOKING_NOT_FOUND, "Booking not found"));
        booking.setPaymentStatus(paymentStatus);
        return bookingRepository.save(booking);
    }

    public List<DriverVerification> getPendingKYC() {
        return driverVerificationRepository.findByStatus("pending");
    }

    @Transactional
    public DriverVerification verifyKYC(String driverId, String status, String remarks) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ApiException(ErrorCode.DRIVER_NOT_FOUND, "Driver not found"));

        List<DriverVerification> verifications = driverVerificationRepository.findByDriverId(driverId);
        DriverVerification verification = verifications.stream()
                .filter(v -> "pending".equalsIgnoreCase(v.getStatus()))
                .findFirst()
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "No pending KYC verification found for this driver"));

        verification.setStatus(status);
        verification.setRejectionReason(remarks);
        verification.setVerifiedAt(LocalDateTime.now());
        verification.setExpiresAt(LocalDateTime.now().plusYears(1));
        driverVerificationRepository.save(verification);

        if ("approved".equalsIgnoreCase(status)) {
            driver.setIsDriverApproved(true);
            driver.setKycStatus("approved");
            driver.setKycVerifiedAt(LocalDateTime.now());
            driver.setKycExpiresAt(LocalDateTime.now().plusYears(1));
        } else {
            driver.setIsDriverApproved(false);
            driver.setKycStatus("rejected");
        }
        driverRepository.save(driver);

        User user = driver.getUser();
        smsService.sendKYCVerifiedSMS(user.getMobile(), user.getFirstName(), status, remarks);
        if (user.getEmail() != null) {
            emailService.sendKYCVerifiedEmail(user.getEmail(), user.getFirstName(), status, remarks);
        }

        return verification;
    }

    public Map<String, Object> getComplaints(int page, int limit, String status) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Complaint> complaintPage;

        if (status != null && !status.trim().isEmpty() && !"all".equalsIgnoreCase(status)) {
            complaintPage = complaintRepository.findByStatus(status.trim(), pageable);
        } else {
            complaintPage = complaintRepository.findAll(pageable);
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

    @Transactional
    public Complaint updateComplaint(String id, String status) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Complaint not found"));
        complaint.setStatus(status);
        return complaintRepository.save(complaint);
    }

    public Map<String, Object> getSOSAlerts(int page, int limit, String status) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SosAlert> alertPage;

        if (status != null && !status.trim().isEmpty() && !"all".equalsIgnoreCase(status)) {
            alertPage = sosAlertRepository.findByStatus(status.trim(), pageable);
        } else {
            alertPage = sosAlertRepository.findAll(pageable);
        }

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", page);
        pagination.put("limit", limit);
        pagination.put("total", alertPage.getTotalElements());
        pagination.put("totalPages", alertPage.getTotalPages());

        Map<String, Object> response = new HashMap<>();
        response.put("sosAlerts", alertPage.getContent());
        response.put("pagination", pagination);
        return response;
    }

    @Transactional
    public SosAlert updateSOSAlertStatus(String id, String status) {
        SosAlert alert = sosAlertRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "SOS alert not found"));
        alert.setStatus(status);
        return sosAlertRepository.save(alert);
    }

    public Map<String, Object> getDriversWalletBalances(int page, int limit, String search) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        // Simulating search on driver users, but for simplicity returning paged drivers
        Page<Driver> driverPage = driverRepository.findAll(pageable);

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", page);
        pagination.put("limit", limit);
        pagination.put("total", driverPage.getTotalElements());
        pagination.put("totalPages", driverPage.getTotalPages());

        List<Map<String, Object>> list = new ArrayList<>();
        for (Driver d : driverPage.getContent()) {
            Map<String, Object> item = new HashMap<>();
            User u = d.getUser();
            item.put("id", d.getId());
            item.put("userId", u.getId());
            item.put("driverName", u.getFirstName() + " " + u.getLastName());
            item.put("mobile", u.getMobile());
            item.put("walletBalance", d.getWalletBalance().doubleValue());
            list.add(item);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("drivers", list);
        response.put("pagination", pagination);
        return response;
    }

    @Transactional
    public Payout createPayout(Map<String, Object> payoutData) {
        String driverId = (String) payoutData.get("driverId");
        Number amount = (Number) payoutData.get("amount");
        String transactionId = (String) payoutData.get("transactionId");

        if (driverId == null || amount == null) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Driver ID and amount are required");
        }

        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ApiException(ErrorCode.DRIVER_NOT_FOUND, "Driver not found"));

        BigDecimal payoutAmount = BigDecimal.valueOf(amount.doubleValue());

        if (driver.getWalletBalance().compareTo(payoutAmount) < 0) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Insufficient driver wallet balance");
        }

        // Deduct from driver wallet
        driver.setWalletBalance(driver.getWalletBalance().subtract(payoutAmount));
        driverRepository.save(driver);

        // Log transaction for driver
        DriverWalletTransaction driverTx = DriverWalletTransaction.builder()
                .driverId(driverId)
                .amount(payoutAmount)
                .type("debit")
                .transactionType("payout")
                .description("Payout request processed by admin. Tx: " + (transactionId != null ? transactionId : "N/A"))
                .build();
        driverWalletTransactionRepository.save(driverTx);

        // Log payout
        Payout payout = Payout.builder()
                .driverId(driverId)
                .amount(payoutAmount)
                .status("completed")
                .payoutMethod("bank_transfer")
                .transactionId(transactionId)
                .processedAt(LocalDateTime.now())
                .build();

        return payoutRepository.save(payout);
    }

    public Map<String, Object> getPayouts(int page, int limit, String status, String driverId) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Payout> payoutPage;

        boolean hasDriver = driverId != null && !driverId.trim().isEmpty();
        boolean hasStatus = status != null && !status.trim().isEmpty() && !"all".equalsIgnoreCase(status);

        if (hasDriver && hasStatus) {
            payoutPage = payoutRepository.findByDriverIdAndStatus(driverId, status, pageable);
        } else if (hasDriver) {
            payoutPage = payoutRepository.findByDriverId(driverId, pageable);
        } else if (hasStatus) {
            payoutPage = payoutRepository.findByStatus(status, pageable);
        } else {
            payoutPage = payoutRepository.findAll(pageable);
        }

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", page);
        pagination.put("limit", limit);
        pagination.put("total", payoutPage.getTotalElements());
        pagination.put("totalPages", payoutPage.getTotalPages());

        Map<String, Object> response = new HashMap<>();
        response.put("payouts", payoutPage.getContent());
        response.put("pagination", pagination);
        return response;
    }

    @Transactional
    public Payout updatePayoutStatus(String payoutId, String status, String transactionId) {
        Payout payout = payoutRepository.findById(payoutId)
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Payout request not found"));

        payout.setStatus(status);
        if (transactionId != null) {
            payout.setTransactionId(transactionId);
        }
        if ("completed".equalsIgnoreCase(status)) {
            payout.setProcessedAt(LocalDateTime.now());
        }

        return payoutRepository.save(payout);
    }

    public Map<String, Object> getSupportTickets(int page, int limit, String status, String priority, String assignedTo) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SupportTicket> ticketPage;

        boolean hasStatus = status != null && !status.trim().isEmpty() && !"all".equalsIgnoreCase(status);
        boolean hasPriority = priority != null && !priority.trim().isEmpty() && !"all".equalsIgnoreCase(priority);
        boolean hasAssigned = assignedTo != null && !assignedTo.trim().isEmpty() && !"all".equalsIgnoreCase(assignedTo);

        if (hasStatus && hasPriority) {
            ticketPage = supportTicketRepository.findByStatusAndPriority(status, priority, pageable);
        } else if (hasStatus) {
            ticketPage = supportTicketRepository.findByStatus(status, pageable);
        } else if (hasPriority) {
            ticketPage = supportTicketRepository.findByPriority(priority, pageable);
        } else if (hasAssigned) {
            ticketPage = supportTicketRepository.findByAssignedTo(assignedTo, pageable);
        } else {
            ticketPage = supportTicketRepository.findAll(pageable);
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

    @Transactional
    public SupportTicket updateSupportTicket(String ticketId, String status, String priority, String assignedTo) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Support ticket not found"));

        if (status != null && !status.isEmpty()) {
            ticket.setStatus(status);
        }
        if (priority != null && !priority.isEmpty()) {
            ticket.setPriority(priority);
        }
        if (assignedTo != null && !assignedTo.isEmpty()) {
            ticket.setAssignedTo(assignedTo);
        }

        return supportTicketRepository.save(ticket);
    }

    public Map<String, Object> getVehicles(int page, int limit, String search, Boolean isActive) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Vehicle> vehiclePage;

        if (isActive != null) {
            vehiclePage = vehicleRepository.findByIsActive(isActive, pageable);
        } else {
            vehiclePage = vehicleRepository.findAll(pageable);
        }

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", page);
        pagination.put("limit", limit);
        pagination.put("total", vehiclePage.getTotalElements());
        pagination.put("totalPages", vehiclePage.getTotalPages());

        Map<String, Object> response = new HashMap<>();
        response.put("vehicles", vehiclePage.getContent());
        response.put("pagination", pagination);
        return response;
    }

    @Transactional
    public Vehicle updateVehicleStatus(String vehicleId, boolean isActive) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Vehicle not found"));
        vehicle.setIsActive(isActive);
        return vehicleRepository.save(vehicle);
    }

    public Map<String, Object> getSurgePricingSettings() {
        String cacheKey = "settings:surge-pricing";
        try {
            String cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                return objectMapper.readValue(cached, Map.class);
            }
        } catch (Exception e) {
            log.error("Redis surge read error", e);
        }

        // Return defaults
        Map<String, Object> defaults = new HashMap<>();
        defaults.put("enabled", false);
        defaults.put("multiplier", 1.0);
        defaults.put("basePricePerKm", 15.0);
        defaults.put("scope", "global");
        return defaults;
    }

    public Map<String, Object> updateSurgePricingSettings(Map<String, Object> settings) {
        String cacheKey = "settings:surge-pricing";
        try {
            redisTemplate.opsForValue().set(cacheKey, objectMapper.writeValueAsString(settings));
        } catch (Exception e) {
            log.error("Redis surge write error", e);
        }
        return settings;
    }

    public Map<String, Object> deleteCitySurgePricingSettings(String city) {
        // Just clear the global setting key for simplicity, or manage city keys
        String cacheKey = "settings:surge-pricing";
        redisTemplate.delete(cacheKey);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Surge settings reset successfully");
        return response;
    }

    public byte[] exportUsersCsv(String role, String search) {
        String roleParam = (role != null && !role.trim().isEmpty()) ? role.trim() : null;
        String searchParam = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        List<User> users = userRepository.searchUsers(roleParam, searchParam, Pageable.unpaged()).getContent();

        StringBuilder csv = new StringBuilder("First Name,Last Name,Mobile,Email,Role,Status,Gender,Created At\n");
        for (User u : users) {
            csv.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                    u.getFirstName() != null ? u.getFirstName().replace("\"", "\"\"") : "",
                    u.getLastName() != null ? u.getLastName().replace("\"", "\"\"") : "",
                    u.getMobile() != null ? u.getMobile().replace("\"", "\"\"") : "",
                    u.getEmail() != null ? u.getEmail().replace("\"", "\"\"") : "",
                    u.getRole() != null ? u.getRole() : "",
                    u.getIsActive() != null && u.getIsActive() ? "Active" : "Inactive",
                    u.getGender() != null ? u.getGender() : "",
                    u.getCreatedAt() != null ? u.getCreatedAt().toString() : ""
            ));
        }

        return csv.toString().getBytes();
    }

    public byte[] exportBookingsCsv(String status, String paymentStatus) {
        String statusParam = (status != null && !status.trim().isEmpty() && !"all".equalsIgnoreCase(status)) ? status.trim() : null;
        String paymentParam = (paymentStatus != null && !paymentStatus.trim().isEmpty() && !"all".equalsIgnoreCase(paymentStatus)) ? paymentStatus.trim() : null;

        List<Booking> bookings = bookingRepository.searchBookings(statusParam, paymentParam, Pageable.unpaged()).getContent();

        StringBuilder csv = new StringBuilder("Booking ID,Date,Customer,Driver,Pickup,Drop,Status,Payment Status,Amount,Payment Method\n");
        for (Booking b : bookings) {
            String customerName = "N/A";
            Optional<Customer> customerOpt = customerRepository.findById(b.getCustomer().getId());
            if (customerOpt.isPresent()) {
                User u = customerOpt.get().getUser();
                customerName = (u.getFirstName() + " " + u.getLastName()).trim();
            }

            String driverName = "N/A";
            String pickup = "N/A";
            String drop = "N/A";

            Optional<Ride> rideOpt = rideRepository.findById(b.getRide().getId());
            if (rideOpt.isPresent()) {
                Ride ride = rideOpt.get();
                pickup = ride.getStartLocation();
                drop = ride.getEndLocation();

                Optional<Driver> driverOpt = driverRepository.findById(ride.getDriver().getId());
                if (driverOpt.isPresent()) {
                    User u = driverOpt.get().getUser();
                    driverName = (u.getFirstName() + " " + u.getLastName()).trim();
                }
            }

            csv.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                    b.getBookingNumber() != null ? b.getBookingNumber() : b.getId(),
                    b.getCreatedAt() != null ? b.getCreatedAt().toString() : "",
                    customerName.replace("\"", "\"\""),
                    driverName.replace("\"", "\"\""),
                    pickup.replace("\"", "\"\""),
                    drop.replace("\"", "\"\""),
                    b.getStatus() != null ? b.getStatus() : "",
                    b.getPaymentStatus() != null ? b.getPaymentStatus() : "",
                    b.getTotalFare() != null ? b.getTotalFare().toString() : "0.00",
                    b.getPaymentMethod() != null ? b.getPaymentMethod() : "N/A"
            ));
        }

        return csv.toString().getBytes();
    }

    public Driver getDriverDetailsByUserId(String userId) {
        return driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.DRIVER_NOT_FOUND, "Driver details not found for user: " + userId));
    }

    @Transactional
    public Driver updateDriverDetails(String userId, Map<String, Object> details) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.DRIVER_NOT_FOUND, "Driver details not found for user: " + userId));

        if (details.containsKey("bank_name")) {
            driver.setBankName((String) details.get("bank_name"));
        }
        if (details.containsKey("bank_ifsc_code")) {
            driver.setBankIfscCode((String) details.get("bank_ifsc_code"));
        }
        if (details.containsKey("bank_account_number")) {
            driver.setBankAccountNumber((String) details.get("bank_account_number"));
        }

        return driverRepository.save(driver);
    }

    public Map<String, Object> getUserDetails(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "User not found: " + userId));

        Map<String, Object> details = new HashMap<>();
        details.put("user", user);

        if ("customer".equalsIgnoreCase(user.getRole())) {
            Optional<Customer> customer = customerRepository.findByUserId(userId);
            customer.ifPresent(c -> details.put("customer", c));
        } else if ("driver".equalsIgnoreCase(user.getRole())) {
            Optional<Driver> driver = driverRepository.findByUserId(userId);
            driver.ifPresent(d -> details.put("driver", d));
        }

        return details;
    }

    @Transactional
    public User editUserDetails(String userId, Map<String, Object> data) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "User not found"));

        if (data.containsKey("first_name")) {
            user.setFirstName((String) data.get("first_name"));
        }
        if (data.containsKey("last_name")) {
            user.setLastName((String) data.get("last_name"));
        }
        if (data.containsKey("email")) {
            user.setEmail((String) data.get("email"));
        }
        if (data.containsKey("gender")) {
            user.setGender((String) data.get("gender"));
        }
        if (data.containsKey("age")) {
            user.setAge((Integer) data.get("age"));
        }

        return userRepository.save(user);
    }
}
