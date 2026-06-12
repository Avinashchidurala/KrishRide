package com.hushryd.backend.repository;

import com.hushryd.backend.entity.SavedAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedAddressRepository extends JpaRepository<SavedAddress, String> {
    List<SavedAddress> findByUserId(String userId);
    List<SavedAddress> findByUserIdOrderByIsDefaultDescCreatedAtDesc(String userId);
    long countByUserId(String userId);
    Optional<SavedAddress> findByUserIdAndAddressType(String userId, String addressType);
}
