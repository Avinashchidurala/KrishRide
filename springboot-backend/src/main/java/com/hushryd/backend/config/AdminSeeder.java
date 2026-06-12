package com.hushryd.backend.config;

import com.hushryd.backend.entity.Admin;
import com.hushryd.backend.entity.User;
import com.hushryd.backend.repository.AdminRepository;
import com.hushryd.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Component
public class AdminSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Override
    public void run(String... args) throws Exception {
        if (adminRepository.count() == 0) {
            String adminMobile = "+919999999999";
            
            // Check if user already exists
            Optional<User> userOpt = userRepository.findByMobile(adminMobile);
            User adminUser;
            
            if (userOpt.isPresent()) {
                adminUser = userOpt.get();
                // Ensure the role is set to admin
                if (!"admin".equals(adminUser.getRole())) {
                    adminUser.setRole("admin");
                    adminUser = userRepository.save(adminUser);
                }
            } else {
                adminUser = User.builder()
                        .id(UUID.randomUUID().toString())
                        .firstName("System")
                        .lastName("Admin")
                        .mobile(adminMobile)
                        .email("admin@hushryd.com")
                        .role("admin")
                        .age(30)
                        .gender("Male")
                        .isPhoneVerified(true)
                        .isActive(true)
                        .profileCompleted(true)
                        .authProvider("otp")
                        .build();
                adminUser = userRepository.save(adminUser);
            }

            Admin admin = Admin.builder()
                    .id(UUID.randomUUID().toString())
                    .user(adminUser)
                    .permissions("ALL")
                    .walletBalance(BigDecimal.ZERO)
                    .build();
            adminRepository.save(admin);

            System.out.println("[INFO] Seeded default admin user successfully.");
            System.out.println("[INFO] Mobile: " + adminMobile);
            System.out.println("[INFO] Role: admin");
        } else {
            System.out.println("[INFO] Admin users already exist in database. Skipping seeding.");
        }
    }
}
