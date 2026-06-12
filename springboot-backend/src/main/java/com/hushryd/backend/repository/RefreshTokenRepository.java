package com.hushryd.backend.repository;

import com.hushryd.backend.entity.RefreshToken;
import com.hushryd.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {
    Optional<RefreshToken> findByToken(String token);
    List<RefreshToken> findByUserAndRevoked(User user, boolean revoked);
}
