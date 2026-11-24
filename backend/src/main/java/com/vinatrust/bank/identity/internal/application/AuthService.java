package com.vinatrust.bank.identity.internal.application;

import com.vinatrust.bank.identity.contracts.events.UserRegisteredEvent;
import com.vinatrust.bank.identity.internal.api.dto.AuthResponse;
import com.vinatrust.bank.identity.internal.api.dto.LoginRequest;
import com.vinatrust.bank.identity.internal.api.dto.RefreshTokenRequest;
import com.vinatrust.bank.identity.internal.api.dto.RegisterRequest;
import com.vinatrust.bank.identity.internal.api.dto.UserProfileResponse;
import com.vinatrust.bank.identity.internal.application.mapper.UserMapper;
import com.vinatrust.bank.identity.internal.domain.RefreshToken;
import com.vinatrust.bank.identity.internal.domain.RefreshTokenRepository;
import com.vinatrust.bank.identity.internal.domain.Role;
import com.vinatrust.bank.identity.internal.domain.User;
import com.vinatrust.bank.identity.internal.domain.UserRepository;
import com.vinatrust.bank.identity.internal.domain.UserStatus;
import com.vinatrust.bank.identity.internal.infrastructure.security.JwtService;
import com.vinatrust.bank.shared.exception.BusinessRuleException;
import com.vinatrust.bank.shared.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ApplicationEventPublisher eventPublisher;
    private final UserMapper userMapper;
    private final long refreshTokenExpirationMs;

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            ApplicationEventPublisher eventPublisher,
            UserMapper userMapper,
            @Value("${app.security.jwt.refresh-token-expiration-ms:604800000}") long refreshTokenExpirationMs
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.eventPublisher = eventPublisher;
        this.userMapper = userMapper;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request, String deviceInfo) {
        // 1. Validation constraints
        if (userRepository.existsByUsername(request.username())) {
            throw new BusinessRuleException("Tên đăng nhập '" + request.username() + "' đã được sử dụng");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessRuleException("Email '" + request.email() + "' đã được đăng ký trong hệ thống");
        }
        if (userRepository.existsByPhone(request.phone())) {
            throw new BusinessRuleException("Số điện thoại '" + request.phone() + "' đã được đăng ký");
        }

        // 2. Hash security fields
        String passwordHash = passwordEncoder.encode(request.password());
        String pinHash = (request.transactionPin() != null && !request.transactionPin().isBlank())
                ? passwordEncoder.encode(request.transactionPin())
                : null;

        // 3. Create domain User (enforce CUSTOMER role, STANDARD tier, no assignedTeam, unverified biometric)
        User user = new User(
                UUID.randomUUID(),
                request.username().trim().toLowerCase(),
                request.email().trim().toLowerCase(),
                request.phone().trim(),
                request.fullName().trim(),
                request.dateOfBirth(),
                passwordHash,
                pinHash,
                Role.CUSTOMER,
                UserStatus.ACTIVE,
                "UNVERIFIED",
                false,       // kycBiometricVerified = false
                "STANDARD",  // customerTier = STANDARD
                null         // assignedTeam = null
        );

        User savedUser = userRepository.save(user);

        // 4. Publish Domain/Integration Event for other modules (e.g. Account provisioning)
        eventPublisher.publishEvent(new UserRegisteredEvent(
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getEmail(),
                savedUser.getFullName(),
                savedUser.getPhone(),
                savedUser.getRole().name(),
                Instant.now()
        ));

        // 5. Generate and return tokens
        return issueTokenPair(savedUser, deviceInfo);
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String deviceInfo) {
        String identifier = request.identifier().trim();
        User user = userRepository.findByUsernameOrEmailOrPhone(identifier)
                .orElseThrow(() -> new BadCredentialsException("Thông tin đăng nhập không chính xác"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Thông tin đăng nhập không chính xác");
        }

        if (user.getStatus() == UserStatus.LOCKED) {
            throw new BusinessRuleException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.");
        }
        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new BusinessRuleException("Tài khoản của bạn đang bị tạm ngưng.");
        }

        return issueTokenPair(user, deviceInfo);
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request, String deviceInfo) {
        String tokenStr = request.refreshToken();
        RefreshToken refreshToken = refreshTokenRepository.findByToken(tokenStr)
                .orElseThrow(() -> new BadCredentialsException("Refresh token không hợp lệ hoặc không tồn tại"));

        if (!refreshToken.isValid()) {
            throw new BadCredentialsException("Refresh token đã hết hạn hoặc bị thu hồi. Vui lòng đăng nhập lại.");
        }

        // Rotate Refresh Token: Revoke old token and issue new pair
        refreshToken.revoke();
        refreshTokenRepository.save(refreshToken);

        User user = refreshToken.getUser();
        return issueTokenPair(user, deviceInfo);
    }

    @Transactional
    public void logout(RefreshTokenRequest request) {
        if (request != null && request.refreshToken() != null) {
            refreshTokenRepository.findByToken(request.refreshToken()).ifPresent(token -> {
                token.revoke();
                refreshTokenRepository.save(token);
            });
        }
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return userMapper.toUserProfileResponse(user);
    }

    private AuthResponse issueTokenPair(User user, String deviceInfo) {
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getUsername(), user.getRole().name());
        String rawRefreshToken = jwtService.generateOpaqueRefreshToken();

        Instant expiresAt = Instant.now().plusMillis(refreshTokenExpirationMs);
        RefreshToken refreshToken = new RefreshToken(
                UUID.randomUUID(),
                user,
                rawRefreshToken,
                expiresAt,
                deviceInfo
        );
        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(
                accessToken,
                rawRefreshToken,
                "Bearer",
                jwtService.getAccessTokenExpirationMs() / 1000,
                userMapper.toUserSummaryDto(user)
        );
    }
}
