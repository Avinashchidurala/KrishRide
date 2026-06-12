package com.hushryd.backend.service;

import com.hushryd.backend.dto.BookingRequests;
import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.entity.*;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private RideRepository rideRepository;

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
    private CloudinaryService cloudinaryService;

    private static final String ADMIN_ID = "ee9d2246-821f-4711-bd58-508c347a47d9";
    private static final BigDecimal DRIVER_CHARGES = BigDecimal.valueOf(20.00);

    @Transactional
    public Map<String, Object> createBooking(String userId, BookingRequests.CreateBookingRequest request) {
        Customer customer = customerRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "Customer profile not found"));

        Ride ride = rideRepository.findById(request.getRideId())
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Ride not found"));

        if (!"active".equals(ride.getStatus())) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Ride is not available for booking");
        }

        int availableSeats = ride.getSeatsAvailable() - ride.getSeatsBooked();
        int passengerCount = request.getPassengerCount() != null ? request.getPassengerCount() : 1;

        if (passengerCount > availableSeats) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Not enough seats available");
        }

        double basePricePerSeat = ride.getPricePerSeat() != null ? ride.getPricePerSeat().doubleValue() : 0.0;
        double customerPlatformFeePerSeat = 10.0;

        double customerPaymentPerSeat = basePricePerSeat + customerPlatformFeePerSeat;
        double customerPayment = customerPaymentPerSeat * passengerCount;

        double driverReceivesPerSeat = basePricePerSeat;
        double driverBaseFare = driverReceivesPerSeat * passengerCount;

        double customerPlatformFee = customerPlatformFeePerSeat * passengerCount;
        double totalFare = customerPayment;

        String bookingNumber = "BK-" + System.currentTimeMillis();
        String pickupOTP = String.valueOf(100000 + new Random().nextInt(900000));

        String dropPin = customer.getDropPin();
        if (dropPin == null || dropPin.trim().isEmpty()) {
            dropPin = String.valueOf(1000 + new Random().nextInt(9000));
            customer.setDropPin(dropPin);
            customerRepository.save(customer);
        }

        Booking booking = Booking.builder()
                .bookingNumber(bookingNumber)
                .ride(ride)
                .customer(customer)
                .passengerCount(passengerCount)
                .backSeatCount(request.getBackSeatCount() != null ? request.getBackSeatCount() : 0)
                .baseFare(BigDecimal.valueOf(driverBaseFare))
                .platformFee(BigDecimal.valueOf(customerPlatformFee))
                .serviceTax(BigDecimal.ZERO)
                .driverFee(BigDecimal.ZERO)
                .totalFare(BigDecimal.valueOf(totalFare))
                .currency("INR")
                .status("pending")
                .paymentStatus("pending")
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "razorpay")
                .pickupOtp(pickupOTP)
                .dropPin(dropPin)
                .pickupLocation(request.getPickupLocation() != null ? request.getPickupLocation() : ride.getStartLocation())
                .pickupLatitude(request.getPickupLatitude() != null ? BigDecimal.valueOf(Double.parseDouble(request.getPickupLatitude())) : ride.getStartLatitude())
                .pickupLongitude(request.getPickupLongitude() != null ? BigDecimal.valueOf(Double.parseDouble(request.getPickupLongitude())) : ride.getStartLongitude())
                .dropLocation(request.getDropLocation() != null ? request.getDropLocation() : ride.getEndLocation())
                .dropLatitude(request.getDropLatitude() != null ? BigDecimal.valueOf(Double.parseDouble(request.getDropLatitude())) : ride.getEndLatitude())
                .dropLongitude(request.getDropLongitude() != null ? BigDecimal.valueOf(Double.parseDouble(request.getDropLongitude())) : ride.getEndLongitude())
                .pickupVerified(false)
                .dropVerified(false)
                .build();

        booking = bookingRepository.save(booking);

        // Reserve seats
        ride.setSeatsBooked(ride.getSeatsBooked() + passengerCount);
        rideRepository.save(ride);

        // Update customer total bookings
        customer.setTotalBookings(customer.getTotalBookings() + 1);
        customerRepository.save(customer);

        // Generate and upload HTML invoice to Cloudinary
        String invoiceUrl = null;
        try {
            String htmlInvoice = generateInvoiceHtml(booking, customer, ride);
            String base64Html = Base64.getEncoder().encodeToString(htmlInvoice.getBytes());
            invoiceUrl = cloudinaryService.uploadBase64(base64Html, "invoices", "invoice_" + booking.getBookingNumber() + ".html");
            booking.setInvoiceUrl(invoiceUrl);
            bookingRepository.save(booking);
        } catch (Exception e) {
            System.err.println("Error creating invoice: " + e.getMessage());
        }

        Map<String, Object> fareBreakdown = new HashMap<>();
        fareBreakdown.put("baseFarePerSeat", basePricePerSeat);
        fareBreakdown.put("baseFare", basePricePerSeat * passengerCount);
        fareBreakdown.put("isSurgeApplied", ride.getIsSurge());
        fareBreakdown.put("surgeMultiplier", ride.getSurgeMultiplier());
        fareBreakdown.put("platformFee", customerPlatformFee);
        fareBreakdown.put("totalFare", totalFare);

        Map<String, Object> response = new HashMap<>();
        response.put("booking", booking);
        response.put("fareBreakdown", fareBreakdown);
        response.put("message", "Booking created successfully. Please complete payment to confirm booking.");

        return response;
    }

    public List<Booking> getMyBookings(String userId) {
        Customer customer = customerRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "Customer profile not found"));
        return bookingRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId());
    }

    public Booking getBookingDetails(String userId, String id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Booking not found"));

        // Auth check
        boolean authorized = booking.getCustomer().getUser().getId().equals(userId) ||
                booking.getRide().getDriver().getUser().getId().equals(userId) ||
                "admin".equals(booking.getCustomer().getUser().getRole());

        if (!authorized) {
            throw new ApiException(ErrorCode.AUTH_FORBIDDEN, "Not authorized to view this booking");
        }

        return booking;
    }

    @Transactional
    public void verifyPickupOtp(String userId, String id, String otp) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "Driver profile not found"));

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Booking not found"));

        if (!booking.getRide().getDriver().getId().equals(driver.getId())) {
            throw new ApiException(ErrorCode.AUTH_FORBIDDEN, "Not authorized to verify this booking");
        }

        if (booking.getPickupOtp() == null || !booking.getPickupOtp().equals(otp)) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Invalid OTP");
        }

        if (!"success".equals(booking.getPaymentStatus()) || !"confirmed".equals(booking.getStatus())) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Booking cannot be started. Payment must be confirmed first.");
        }

        // Update booking status
        booking.setPickupVerified(true);
        booking.setStatus("started");
        bookingRepository.save(booking);

        // Update ride status
        Ride ride = booking.getRide();
        ride.setStatus("started");
        ride.setStartedAt(LocalDateTime.now());
        ride.setLastActiveAt(LocalDateTime.now());
        rideRepository.save(ride);
    }

    @Transactional
    public void verifyDropPin(String userId, String id, String pin) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "Driver profile not found"));

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Booking not found"));

        if (!booking.getRide().getDriver().getId().equals(driver.getId())) {
            throw new ApiException(ErrorCode.AUTH_FORBIDDEN, "Not authorized to verify this booking");
        }

        if (booking.getDropPin() == null || !booking.getDropPin().equals(pin)) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Invalid PIN");
        }

        if ("completed".equals(booking.getStatus())) {
            return; // idempotent
        }

        if (!"started".equals(booking.getStatus())) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Booking must be in 'started' status");
        }

        // Complete booking
        booking.setDropVerified(true);
        booking.setStatus("completed");
        bookingRepository.save(booking);

        Ride ride = booking.getRide();

        // Check if all bookings for this ride are completed
        List<Booking> bookings = bookingRepository.findByRideId(ride.getId());
        long completedCount = bookings.stream().filter(b -> "completed".equals(b.getStatus())).count();

        if (completedCount == bookings.size()) {
            ride.setStatus("completed");
            ride.setCompletedAt(LocalDateTime.now());
            rideRepository.save(ride);

            // Settle earnings to driver wallet
            BigDecimal pricePerSeat = ride.getPricePerSeat() != null ? ride.getPricePerSeat() : BigDecimal.ZERO;
            BigDecimal totalSeatsBooked = BigDecimal.valueOf(ride.getSeatsBooked());
            BigDecimal driverEarnings = pricePerSeat.multiply(totalSeatsBooked).subtract(DRIVER_CHARGES);

            // Deduct from Admin
            Optional<Admin> adminOpt = adminRepository.findById(ADMIN_ID);
            if (adminOpt.isPresent()) {
                Admin admin = adminOpt.get();
                admin.setWalletBalance(admin.getWalletBalance().subtract(driverEarnings));
                adminRepository.save(admin);
            }

            adminWalletTransactionRepository.save(AdminWalletTransaction.builder()
                    .adminId(ADMIN_ID)
                    .amount(driverEarnings)
                    .type("debit")
                    .description("Trip settlement for ride " + ride.getId())
                    .bookingId(booking.getId())
                    .driverId(driver.getId())
                    .customerId(booking.getCustomer().getId())
                    .transactionType("trip_payment_to_driver")
                    .build());

            // Credit Driver
            driver.setTotalEarnings(driver.getTotalEarnings().add(driverEarnings));
            driver.setWalletBalance(driver.getWalletBalance().add(driverEarnings));
            driver.setCompletedRides(driver.getCompletedRides() + 1);
            driverRepository.save(driver);

            driverWalletTransactionRepository.save(DriverWalletTransaction.builder()
                    .driverId(driver.getId())
                    .amount(driverEarnings)
                    .type("credit")
                    .transactionType("trip_payment")
                    .description("Driver settlement for booking " + booking.getBookingNumber())
                    .bookingId(booking.getId())
                    .build());
        }

        // Update customer completed bookings
        Customer customer = booking.getCustomer();
        customer.setCompletedBookings(customer.getCompletedBookings() + 1);
        customerRepository.save(customer);
    }

    @Transactional
    public void cancelBooking(String userId, String id) {
        Customer customer = customerRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "Customer profile not found"));

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "Booking not found"));

        if (!booking.getCustomer().getId().equals(customer.getId())) {
            throw new ApiException(ErrorCode.AUTH_FORBIDDEN, "Not authorized to cancel this booking");
        }

        if ("cancelled".equals(booking.getStatus())) {
            return;
        }

        booking.setStatus("cancelled");
        booking.setCancelledBy("customer");
        bookingRepository.save(booking);

        // Free up seats
        Ride ride = booking.getRide();
        ride.setSeatsBooked(Math.max(0, ride.getSeatsBooked() - booking.getPassengerCount()));
        rideRepository.save(ride);

        customer.setCancelledBookings(customer.getCancelledBookings() + 1);
        customerRepository.save(customer);
    }

    private String generateInvoiceHtml(Booking booking, Customer customer, Ride ride) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        return "<html>" +
                "<head><style>body { font-family: sans-serif; padding: 20px; } table { width: 100%; border-collapse: collapse; } th, td { padding: 10px; border: 1px solid #ccc; text-align: left; }</style></head>" +
                "<body>" +
                "<h1>Invoice</h1>" +
                "<p><strong>Booking Number:</strong> " + booking.getBookingNumber() + "</p>" +
                "<p><strong>Customer:</strong> " + customer.getUser().getFirstName() + " " + customer.getUser().getLastName() + "</p>" +
                "<p><strong>Driver:</strong> " + ride.getDriver().getUser().getFirstName() + " " + ride.getDriver().getUser().getLastName() + "</p>" +
                "<table>" +
                "<tr><th>Description</th><th>Details</th></tr>" +
                "<tr><td>Pickup Location</td><td>" + booking.getPickupLocation() + "</td></tr>" +
                "<tr><td>Drop Location</td><td>" + booking.getDropLocation() + "</td></tr>" +
                "<tr><td>Scheduled Time</td><td>" + ride.getScheduledTime().format(formatter) + "</td></tr>" +
                "<tr><td>Passengers</td><td>" + booking.getPassengerCount() + "</td></tr>" +
                "<tr><td>Base Fare</td><td>INR " + booking.getBaseFare() + "</td></tr>" +
                "<tr><td>Platform Fee</td><td>INR " + booking.getPlatformFee() + "</td></tr>" +
                "<tr><td><strong>Total Amount</strong></td><td><strong>INR " + booking.getTotalFare() + "</strong></td></tr>" +
                "</table>" +
                "</body>" +
                "</html>";
    }
}
