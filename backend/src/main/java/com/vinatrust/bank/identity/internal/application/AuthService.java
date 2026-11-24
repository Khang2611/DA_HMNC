package com.vinatrust.bank.identity.internal.application;

import com.vinatrust.bank.identity.contracts.events.UserRegisteredEvent;
import com.vinatrust.bank.identity.internal.api.dto.AuthResponse;
import com.vinatrust.bank.identity.internal.api.dto.LoginRequest;
import com.vinatrust.bank.identity.internal.api.dto.RefreshTokenRequest;
import com.vinatrust.bank.identity.internal.api.dto.RegisterRequest;
import com.vinatrust.bank.identity.internal.api.dto.RegisterResponse;
import com.vinatrust.bank.identity.internal.api.dto.ResendVerificationRequest;
import com.vinatrust.bank.identity.internal.api.dto.UserProfileResponse;
import com.vinatrust.bank.identity.internal.api.dto.VerifyEmailRequest;
import com.vinatrust.bank.identity.internal.application.event.EmailVerificationRequestedEvent;
import com.vinatrust.bank.identity.internal.application.mapper.UserMapper;
import com.vinatrust.bank.identity.internal.application.util.OtpUtil;
import com.vinatrust.bank.identity.internal.domain.EmailVerificationToken;
import com.vinatrust.bank.identity.internal.domain.EmailVerificationTokenRepository;
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

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ApplicationEventPublisher eventPublisher;
    private final UserMapper userMapper;

    private final long refreshTokenExpirationMs;
    private final int otpExpirationMinutes;
    private final int maxAttempts;
    private final int resendCooldownSeconds;

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            EmailVerificationTokenRepository emailVerificationTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            ApplicationEventPublisher eventPublisher,
            UserMapper userMapper,
            @Value("${app.security.jwt.refresh-token-expiration-ms:604800000}") long refreshTokenExpirationMs,
            @Value("${app.verification.otp-expiration-minutes:15}") int otpExpirationMinutes,
            @Value("${app.verification.max-attempts:5}") int maxAttempts,
            @Value("${app.verification.resend-cooldown-seconds:60}") int resendCooldownSeconds
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.eventPublisher = eventPublisher;
        this.userMapper = userMapper;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
        this.otpExpirationMinutes = otpExpirationMinutes;
        this.maxAttempts = maxAttempts;
        this.resendCooldownSeconds = resendCooldownSeconds;
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
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

        // 3. Create domain User (enforce CUSTOMER role, PENDING_VERIFICATION status, emailVerified=false)
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
                UserStatus.PENDING_VERIFICATION,
                "UNVERIFIED",
                false,      // kycBiometricVerified = false
                false,      // emailVerified = false
                "STANDARD", // customerTier = STANDARD
                null        // assignedTeam = null
        );

        User savedUser = userRepository.save(user);

        // 4. Generate 6-digit OTP and store SHA-256 hash
        String otpCode = OtpUtil.generate6DigitOtp();
        String otpHash = OtpUtil.hashSha256(otpCode);
        Instant expiresAt = Instant.now().plus(Duration.ofMinutes(otpExpirationMinutes));

        EmailVerificationToken token = new EmailVerificationToken(savedUser.getId(), otpHash, expiresAt);
        emailVerificationTokenRepository.save(token);

        // 5. Publish internal event to send verification email (NO JWT and NO UserRegisteredEvent yet)
        eventPublisher.publishEvent(new EmailVerificationRequestedEvent(
                savedUser.getEmail(),
                savedUser.getFullName(),
                otpCode,
                otpExpirationMinutes
        ));

        return new RegisterResponse(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getStatus().name(),
                "Đăng ký tài khoản thành công. Vui lòng kiểm tra email để lấy mã OTP xác thực kích hoạt tài khoản."
        );
    }

    @Transactional
    public void verifyEmail(VerifyEmailRequest request) {
        String email = request.email().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.email()));

        if (user.isEmailVerified() || user.getStatus() != UserStatus.PENDING_VERIFICATION) {
            throw new BusinessRuleException("Tài khoản đã được kích hoạt hoặc không ở trạng thái chờ xác thực");
        }

        EmailVerificationToken token = emailVerificationTokenRepository.findLatestActiveByUserId(user.getId())
                .orElseThrow(() -> new BusinessRuleException("Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng yêu cầu gửi lại mã mới."));

        Instant now = Instant.now();
        if (token.isExpired(now)) {
            throw new BusinessRuleException("Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.");
        }

        if (token.isMaxAttemptsReached(maxAttempts)) {
            throw new BusinessRuleException("Mã OTP đã bị vô hiệu hóa do nhập sai quá " + maxAttempts + " lần. Vui lòng yêu cầu gửi lại mã mới.");
        }

        String inputOtpHash = OtpUtil.hashSha256(request.otp().trim());
        if (!token.getOtpHash().equals(inputOtpHash)) {
            token.incrementAttempt();
            emailVerificationTokenRepository.save(token);

            int remaining = Math.max(0, maxAttempts - token.getAttemptCount());
            if (remaining == 0) {
                throw new BusinessRuleException("Bạn đã nhập sai mã OTP quá " + maxAttempts + " lần. Mã xác thực đã bị vô hiệu hóa, vui lòng gửi lại mã mới.");
            } else {
                throw new BusinessRuleException("Mã OTP không chính xác. Bạn còn " + remaining + " lần thử.");
            }
        }

        // OTP matched: Activate user & mark token as used
        token.markUsed();
        emailVerificationTokenRepository.save(token);

        user.verifyEmail();
        userRepository.save(user);

        // Publish Integration Event to provision default bank accounts in banking module
        eventPublisher.publishEvent(new UserRegisteredEvent(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getRole().name(),
                Instant.now()
        ));
    }

    @Transactional
    public void resendVerification(ResendVerificationRequest request) {
        String email = request.email().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.email()));

        if (user.isEmailVerified() || user.getStatus() != UserStatus.PENDING_VERIFICATION) {
            throw new BusinessRuleException("Tài khoản đã được kích hoạt hoặc không ở trạng thái chờ xác thực");
        }

        // Check cooldown from latest token creation time
        Optional<EmailVerificationToken> latestOpt = emailVerificationTokenRepository.findLatestActiveByUserId(user.getId());
        if (latestOpt.isPresent()) {
            Instant cooldownUntil = latestOpt.get().getCreatedAt().plusSeconds(resendCooldownSeconds);
            Instant now = Instant.now();
            if (now.isBefore(cooldownUntil)) {
                long remainingSeconds = Duration.between(now, cooldownUntil).toSeconds() + 1;
                throw new BusinessRuleException("Vui lòng chờ " + remainingSeconds + " giây trước khi yêu cầu gửi lại mã OTP.");
            }
        }

        // Invalidate older unused tokens
        emailVerificationTokenRepository.invalidateAllByUserId(user.getId());

        // Generate and save new OTP
        String otpCode = OtpUtil.generate6DigitOtp();
        String otpHash = OtpUtil.hashSha256(otpCode);
        Instant expiresAt = Instant.now().plus(Duration.ofMinutes(otpExpirationMinutes));

        EmailVerificationToken newToken = new EmailVerificationToken(user.getId(), otpHash, expiresAt);
        emailVerificationTokenRepository.save(newToken);

        // Publish internal notification event
        eventPublisher.publishEvent(new EmailVerificationRequestedEvent(
                user.getEmail(),
                user.getFullName(),
                otpCode,
                otpExpirationMinutes
        ));
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String deviceInfo) {
        String identifier = request.identifier().trim();
        User user = userRepository.findByUsernameOrEmailOrPhone(identifier)
                .orElseThrow(() -> new BadCredentialsException("Thông tin đăng nhập không chính xác"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Thông tin đăng nhập không chính xác");
        }

        // Account status enforcement
        if (user.getStatus() == UserStatus.PENDING_VERIFICATION || !user.isEmailVerified()) {
            throw new BusinessRuleException("Tài khoản chưa được kích hoạt. Vui lòng xác thực email bằng mã OTP trước khi đăng nhập.");
        }
        if (user.getStatus() == UserStatus.LOCKED) {
            throw new BusinessRuleException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ bộ phận CSKH để được hỗ trợ.");
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
