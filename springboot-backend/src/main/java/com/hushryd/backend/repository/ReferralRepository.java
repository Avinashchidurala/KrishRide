package com.hushryd.backend.repository;

import com.hushryd.backend.entity.Referral;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReferralRepository extends JpaRepository<Referral, String> {
    Optional<Referral> findByReferralCode(String referralCode);
    List<Referral> findByReferrerId(String referrerId);
    List<Referral> findByReferrerIdAndRefereeIdIsNotNull(String referrerId);
    Optional<Referral> findByReferrerIdAndRefereeIdIsNull(String referrerId);
    Optional<Referral> findByRefereeIdAndStatus(String refereeId, String status);
}
