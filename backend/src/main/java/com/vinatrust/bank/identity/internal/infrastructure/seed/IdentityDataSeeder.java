package com.vinatrust.bank.identity.internal.infrastructure.seed;

import com.vinatrust.bank.identity.internal.domain.Role;
import com.vinatrust.bank.identity.internal.domain.User;
import com.vinatrust.bank.identity.internal.domain.UserRepository;
import com.vinatrust.bank.identity.internal.domain.UserStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
@Order(1)
public class IdentityDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(IdentityDataSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin.username:admin}")
    private String adminUsername;

    @Value("${app.seed.admin.password:VinaTrustAdmin@2026}")
    private String adminPassword;

    @Value("${app.seed.admin.email:admin@vinatrust.vn}")
    private String adminEmail;

    @Value("${app.seed.admin.phone:0900000001}")
    private String adminPhone;

    public IdentityDataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // Idempotent check: Ensure only 1 ADMIN account is created
        if (userRepository.existsByRole(Role.ADMIN) || userRepository.existsByUsername(adminUsername)) {
            log.info("ADMIN account already exists. Skipping Identity data seeding.");
            return;
        }

        String passwordHash = passwordEncoder.encode(adminPassword);

        User admin = new User(
                UUID.randomUUID(),
                adminUsername.trim().toLowerCase(),
                adminEmail.trim().toLowerCase(),
                adminPhone.trim(),
                "Quản Trị Viên Hệ Thống",
                null,
                passwordHash,
                null,
                Role.ADMIN,
                UserStatus.ACTIVE,
                "VERIFIED",
                true, // kycBiometricVerified
                true, // emailVerified
                null,
                null
        );

        userRepository.save(admin);
        log.info("Successfully seeded default ADMIN account: username='{}', email='{}', role=[{}]",
                adminUsername, adminEmail, Role.ADMIN);
    }
}
