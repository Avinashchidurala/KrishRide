package com.hushryd.backend.repository;

import com.hushryd.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByMobile(String mobile);
    Optional<User> findByEmail(String email);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE (:role IS NULL OR u.role = :role) AND " +
           "(:search IS NULL OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.mobile) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    org.springframework.data.domain.Page<User> searchUsers(
            @org.springframework.data.repository.query.Param("role") String role,
            @org.springframework.data.repository.query.Param("search") String search,
            org.springframework.data.domain.Pageable pageable);
}
