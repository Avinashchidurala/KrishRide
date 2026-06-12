package com.hushryd.backend.repository;

import com.hushryd.backend.entity.ServiceState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ServiceStateRepository extends JpaRepository<ServiceState, String> {
    Optional<ServiceState> findByNameAndIsActive(String name, Boolean isActive);
    Optional<ServiceState> findByName(String name);
}
