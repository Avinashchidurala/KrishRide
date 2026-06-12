package com.hushryd.backend.repository;

import com.hushryd.backend.entity.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DriverRepository extends JpaRepository<Driver, String> {
    Optional<Driver> findByUserId(String userId);
}
