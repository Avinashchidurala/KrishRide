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
import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
public class ReferralService {

    @Autowired
    private ReferralRepository referralRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private WalletTransactionRepository walletTransactionRepository;

    private String generateReferralCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder("HUSH");
        for (int i = 0; i < 6; i++) {
            int index = (int) (Math.random() * chars.length());
            sb.append(chars.charAt(index));
        }
        return sb.toString();
    }

    @Transactional
    public Map<String, Object> getReferralCode(String userId) {
        Customer customer = customerRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.CUSTOMER_NOT_FOUND, "Customer not found"));

        // Find existing referral record where this customer is the referrer and referee is null (the template code)
        Optional<Referral> existingReferral = referralRepository.findByReferrerIdAndRefereeIdIsNull(customer.getId());

        String referralCode;
        if (existingReferral.isEmpty()) {
            referralCode = generateReferralCode();
            Referral referral = Referral.builder()
                    .referrerId(customer.getId())
                    .referralCode(referralCode)
                    .status("pending")
                    .validTill(LocalDateTime.now().plusYears(1))
                    .userType("customer")
                    .amount(BigDecimal.valueOf(100.00))
                    .build();
            referralRepository.save(referral);
        } else {
            referralCode = existingReferral.get().getReferralCode();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("referralCode", referralCode);
        response.put("message", "Refer now and Earn ₹100 Hush Cash");
        response.put("terms", "Earn ₹100 for each successful referral when the referred customer registers using your referral code and completes their first valid Ride. The bonus is non-transferable, cannot be redeemed for cash, and will be credited after your referee completes the first successful trip.");
        return response;
    }

    public Map<String, Object> getReferralStats(String userId) {
        Customer customer = customerRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.CUSTOMER_NOT_FOUND, "Customer not found"));

        List<Referral> referrals = referralRepository.findByReferrerIdAndRefereeIdIsNotNull(customer.getId());

        int totalReferrals = referrals.size();
        long successfulReferrals = referrals.stream().filter(r -> "completed".equalsIgnoreCase(r.getStatus())).count();
        long pendingReferrals = referrals.stream().filter(r -> "pending".equalsIgnoreCase(r.getStatus())).count();
        double totalEarnings = successfulReferrals * 100.0;

        List<Map<String, Object>> referralDetails = new ArrayList<>();
        for (Referral r : referrals) {
            Map<String, Object> details = new HashMap<>();
            details.put("id", r.getId());
            details.put("referralCode", r.getReferralCode());
            details.put("status", r.getStatus());
            details.put("createdAt", r.getCreatedAt());
            details.put("creditedAt", r.getCreditedAt());

            Optional<Customer> refereeCust = customerRepository.findById(r.getRefereeId());
            if (refereeCust.isPresent()) {
                User u = refereeCust.get().getUser();
                Map<String, String> refereeInfo = new HashMap<>();
                refereeInfo.put("name", u.getFirstName() + " " + u.getLastName());
                refereeInfo.put("mobile", u.getMobile());
                details.put("referee", refereeInfo);
            } else {
                details.put("referee", null);
            }
            referralDetails.add(details);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("totalReferrals", totalReferrals);
        response.put("successfulReferrals", (int) successfulReferrals);
        response.put("pendingReferrals", (int) pendingReferrals);
        response.put("totalEarnings", totalEarnings);
        response.put("referrals", referralDetails);
        return response;
    }

    @Transactional
    public Map<String, Object> applyReferralCode(String referralCode, String refereeCustomerId) {
        // Find if referralCode matches a pending template code (refereeId is null)
        Optional<Referral> referralOpt = referralRepository.findByReferralCode(referralCode);
        if (referralOpt.isEmpty() || !"pending".equalsIgnoreCase(referralOpt.get().getStatus()) || referralOpt.get().getRefereeId() != null) {
            throw new ApiException(ErrorCode.VALIDATION_REQUIRED, "Invalid referral code");
        }

        Referral referral = referralOpt.get();

        // Update referral record
        referral.setRefereeId(refereeCustomerId);
        referral.setStatus("pending"); // stays pending until first ride is completed
        referralRepository.save(referral);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Referral code applied successfully");
        return response;
    }

    @Transactional
    public void processReferralBonus(String customerId, String bookingId) {
        try {
            Optional<Referral> referralOpt = referralRepository.findByRefereeIdAndStatus(customerId, "pending");
            if (referralOpt.isEmpty()) {
                return; // No referral to process
            }

            Referral referral = referralOpt.get();

            Customer customer = customerRepository.findById(customerId)
                    .orElse(null);
            if (customer == null) {
                return;
            }

            User user = customer.getUser();
            boolean isDriver = "driver".equalsIgnoreCase(user.getRole());

            if (isDriver) {
                // For drivers: check if this is their first ride post
                Driver driver = driverRepository.findByUserId(user.getId()).orElse(null);
                if (driver == null || driver.getTotalRides() != 1) {
                    return; // Not first ride post
                }
            } else {
                // For customers: check if this is their first completed ride
                if (bookingId == null || customer.getCompletedBookings() != 1) {
                    return; // Not first completed ride
                }
            }

            LocalDateTime expiryDate = LocalDateTime.now().plusDays(30);

            // Credit ₹100 to referrer's wallet
            Customer referrer = customerRepository.findById(referral.getReferrerId()).orElse(null);
            if (referrer != null) {
                referrer.setWalletBalance(referrer.getWalletBalance().add(BigDecimal.valueOf(100)));
                customerRepository.save(referrer);

                // Create wallet transaction for referrer
                String bonusDescription = isDriver
                        ? "Referral bonus - ₹100 (Driver posted first ride)"
                        : "Referral bonus - ₹100";

                WalletTransaction referrerTx = WalletTransaction.builder()
                        .customerId(referrer.getId())
                        .amount(BigDecimal.valueOf(100.00))
                        .type("credit")
                        .transactionType("referral")
                        .description(bonusDescription)
                        .referralId(referral.getId())
                        .validTill(expiryDate)
                        .build();
                walletTransactionRepository.save(referrerTx);
            }

            // Credit ₹100 to referee's wallet (only if they are a customer, not driver)
            if (!isDriver) {
                customer.setWalletBalance(customer.getWalletBalance().add(BigDecimal.valueOf(100)));
                customerRepository.save(customer);

                WalletTransaction refereeTx = WalletTransaction.builder()
                        .customerId(customerId)
                        .amount(BigDecimal.valueOf(100.00))
                        .type("credit")
                        .transactionType("referral")
                        .description("Referral bonus - ₹100")
                        .referralId(referral.getId())
                        .validTill(expiryDate)
                        .build();
                walletTransactionRepository.save(refereeTx);
            }

            // Update referral status
            referral.setStatus("completed");
            referral.setCreditedAt(LocalDateTime.now());
            referralRepository.save(referral);

            log.info("Processed referral bonus for referral: {}", referral.getId());
        } catch (Exception e) {
            log.error("Process referral bonus error", e);
        }
    }
}
