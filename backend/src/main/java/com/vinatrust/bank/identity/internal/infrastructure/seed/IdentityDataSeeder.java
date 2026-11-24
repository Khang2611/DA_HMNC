package com.vinatrust.bank.identity.internal.infrastructure.seed;

import com.vinatrust.bank.identity.internal.domain.Role;
import com.vinatrust.bank.identity.internal.domain.User;
import com.vinatrust.bank.identity.internal.domain.UserRepository;
import com.vinatrust.bank.identity.internal.domain.UserStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    public IdentityDataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        String defaultPasswordHash = passwordEncoder.encode("VinaTrust@123");
        String defaultPinHash = passwordEncoder.encode("123456");

        // 1. Seed Customer 1 (matching frontend mock user credentials for smooth integration)
        seedUser(
                "customer1",
                "quy.nguyen@mauvebank.vn",
                "0901234567",
                "Quý Nguyễn",
                "15/08/1994",
                defaultPasswordHash,
                defaultPinHash,
                Role.CUSTOMER,
                "VERIFIED",
                "Mauve Premier"
        );

        // 2. Seed Agent 1
        seedUser(
                "agent1",
                "agent1@vinatrust.vn",
                "0902234567",
                "Nguyễn Văn Agent",
                "20/03/1992",
                defaultPasswordHash,
                defaultPinHash,
                Role.AGENT,
                "VERIFIED",
                "STANDARD"
        );

        // 3. Seed Team Lead 1
        seedUser(
                "lead1",
                "lead1@vinatrust.vn",
                "0903234567",
                "Trần Thị Lead",
                "10/06/1988",
                defaultPasswordHash,
                defaultPinHash,
                Role.TEAM_LEAD,
                "VERIFIED",
                "STANDARD"
        );

        // 4. Seed Admin 1
        seedUser(
                "admin1",
                "admin1@vinatrust.vn",
                "0904234567",
                "Quản Trị Viên VinaTrust",
                "01/01/1985",
                defaultPasswordHash,
                defaultPinHash,
                Role.ADMIN,
                "VERIFIED",
                "SYSTEM"
        );
    }

    private void seedUser(
            String username,
            String email,
            String phone,
            String fullName,
            String dateOfBirth,
            String passwordHash,
            String pinHash,
            Role role,
            String kycStatus,
            String customerTier
    ) {
        if (!userRepository.existsByUsername(username)) {
            User user = new User(
                    UUID.randomUUID(),
                    username,
                    email,
                    phone,
                    fullName,
                    dateOfBirth,
                    passwordHash,
                    pinHash,
                    role,
                    UserStatus.ACTIVE,
                    kycStatus,
                    customerTier
            );
            userRepository.save(user);
            log.info("Seeded user '{}' with role [{}]", username, role);
        }
    }
}

