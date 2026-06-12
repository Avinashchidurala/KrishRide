package com.hushryd.backend.repository;

import com.hushryd.backend.entity.EmergencyContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmergencyContactRepository extends JpaRepository<EmergencyContact, String> {
    List<EmergencyContact> findByUserId(String userId);
    Optional<EmergencyContact> findByUserIdAndIsPrimary(String userId, boolean isPrimary);
    Optional<EmergencyContact> findByUserIdAndMobile(String userId, String mobile);
}
