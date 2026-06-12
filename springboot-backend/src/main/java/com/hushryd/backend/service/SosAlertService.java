package com.hushryd.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hushryd.backend.entity.*;
import com.hushryd.backend.exception.ApiException;
import com.hushryd.backend.dto.ErrorCode;
import com.hushryd.backend.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class SosAlertService {

    @Autowired
    private SosAlertRepository sosAlertRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private EmergencyContactRepository emergencyContactRepository;

    @Autowired
    private SmsService smsService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${admin.email:admin@hushryd.com}")
    private String adminEmail;

    @Transactional
    public Map<String, Object> createSosAlert(String userId, BigDecimal latitude, BigDecimal longitude, String message, String bookingId) {
        if (latitude == null || longitude == null) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Valid latitude and longitude coordinates are required");
        }

        if (latitude.doubleValue() < -90.0 || latitude.doubleValue() > 90.0 ||
                longitude.doubleValue() < -180.0 || longitude.doubleValue() > 180.0) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Invalid coordinate values. Latitude: -90 to 90, Longitude: -180 to 180");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "User not found"));

        String activeBookingId = bookingId;

        // Try to detect active booking from customer/driver role if bookingId not provided
        if (activeBookingId == null || activeBookingId.trim().isEmpty()) {
            if ("customer".equalsIgnoreCase(user.getRole())) {
                Optional<Customer> customer = customerRepository.findByUserId(userId);
                if (customer.isPresent()) {
                    List<Booking> activeBookings = bookingRepository.findByCustomerIdAndStatus(customer.get().getId(), "started");
                    if (!activeBookings.isEmpty()) {
                        activeBookingId = activeBookings.get(0).getId();
                    }
                }
            } else if ("driver".equalsIgnoreCase(user.getRole())) {
                Optional<Driver> driver = driverRepository.findByUserId(userId);
                if (driver.isPresent()) {
                    List<Ride> activeRides = rideRepository.findByDriverIdAndStatus(driver.get().getId(), "started");
                    if (!activeRides.isEmpty()) {
                        List<Booking> activeBookings = bookingRepository.findByRideId(activeRides.get(0).getId());
                        // Find a started booking if available
                        for (Booking b : activeBookings) {
                            if ("started".equalsIgnoreCase(b.getStatus())) {
                                activeBookingId = b.getId();
                                break;
                            }
                        }
                        if (activeBookingId == null && !activeBookings.isEmpty()) {
                            activeBookingId = activeBookings.get(0).getId();
                        }
                    }
                }
            }
        }

        SosAlert sosAlert = SosAlert.builder()
                .userId(userId)
                .bookingId(activeBookingId)
                .latitude(latitude)
                .longitude(longitude)
                .message(message != null ? message : "Emergency SOS alert")
                .status("active")
                .build();

        sosAlert = sosAlertRepository.save(sosAlert);

        // Send SMS to emergency contacts asynchronously
        List<EmergencyContact> contacts = emergencyContactRepository.findByUserId(userId);
        if (!contacts.isEmpty()) {
            String locationUrl = "https://www.google.com/maps?q=" + latitude + "," + longitude;
            String smsMessage = String.format("🚨 SOS ALERT: %s %s needs help. Location: %s",
                    user.getFirstName(), user.getLastName(), locationUrl);

            log.info("[SOS] Sending SMS to {} emergency contact(s)", contacts.size());
            for (EmergencyContact contact : contacts) {
                smsService.sendSMS(contact.getMobile(), smsMessage);
            }
        }

        // Cache alert in Redis for admin dashboard notifications
        try {
            String notificationKey = "admin:notification:sos:" + sosAlert.getId();
            Map<String, Object> notification = new HashMap<>();
            notification.put("id", sosAlert.getId());
            notification.put("type", "sos_alert");
            notification.put("title", String.format("🚨 SOS Alert: %s %s", user.getFirstName(), user.getLastName()));
            notification.put("message", message != null ? message : "Emergency SOS alert triggered");
            notification.put("userId", userId);
            notification.put("userName", user.getFirstName() + " " + user.getLastName());
            notification.put("userMobile", user.getMobile());
            notification.put("userRole", user.getRole());
            notification.put("latitude", latitude);
            notification.put("longitude", longitude);
            notification.put("locationUrl", "https://www.google.com/maps?q=" + latitude + "," + longitude);
            notification.put("bookingId", activeBookingId);
            notification.put("timestamp", LocalDateTime.now().toString());
            notification.put("read", false);

            String jsonPayload = objectMapper.writeValueAsString(notification);

            // Store single notification in Redis for 24 hours
            redisTemplate.opsForValue().set(notificationKey, jsonPayload, 24, TimeUnit.HOURS);

            // Update list of admin notifications
            String listKey = "admin:notifications:list";
            String existingNotificationsJson = redisTemplate.opsForValue().get(listKey);
            List<Map<String, Object>> notificationsList = new ArrayList<>();
            if (existingNotificationsJson != null) {
                notificationsList = objectMapper.readValue(existingNotificationsJson, List.class);
            }
            notificationsList.add(0, notification);
            if (notificationsList.size() > 100) {
                notificationsList = notificationsList.subList(0, 100);
            }
            redisTemplate.opsForValue().set(listKey, objectMapper.writeValueAsString(notificationsList), 24, TimeUnit.HOURS);

        } catch (Exception e) {
            log.error("Error creating admin SOS notification in Redis", e);
        }

        // Notify admin via email
        String locationUrl = "https://www.google.com/maps?q=" + latitude + "," + longitude;
        String adminEmailHtml = String.format(
                "<h2>🚨 SOS Alert Received</h2>" +
                "<p><strong>User:</strong> %s %s</p>" +
                "<p><strong>Mobile:</strong> %s</p>" +
                "<p><strong>Role:</strong> %s</p>" +
                "<p><strong>Location:</strong> <a href=\"%s\">%s, %s</a></p>" +
                "<p><strong>Active Booking ID:</strong> %s</p>" +
                "<p><strong>Message:</strong> %s</p>" +
                "<p><strong>SOS Alert ID:</strong> %s</p>",
                user.getFirstName(), user.getLastName(), user.getMobile(), user.getRole(),
                locationUrl, latitude, longitude,
                activeBookingId != null ? activeBookingId : "None",
                message != null ? message : "Emergency SOS alert",
                sosAlert.getId()
        );
        emailService.sendEmail(adminEmail, "🚨 SOS Alert: " + user.getFirstName() + " " + user.getLastName(), adminEmailHtml);

        Map<String, Object> response = new HashMap<>();
        response.put("sosAlert", sosAlert);
        response.put("message", "SOS alert sent successfully. Admin and emergency contacts have been notified.");
        
        Map<String, Object> lastKnown = new HashMap<>();
        lastKnown.put("latitude", latitude);
        lastKnown.put("longitude", longitude);
        lastKnown.put("timestamp", LocalDateTime.now());
        response.put("lastKnownLocation", lastKnown);

        return response;
    }

    public List<SosAlert> getUserSosAlerts(String userId) {
        return sosAlertRepository.findTop10ByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public SosAlert updateSosAlertStatus(String id, String status) {
        SosAlert alert = sosAlertRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.VALIDATION_REQUIRED, "SOS alert not found"));
        alert.setStatus(status);
        return sosAlertRepository.save(alert);
    }
}
