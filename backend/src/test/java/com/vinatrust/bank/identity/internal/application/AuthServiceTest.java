package com.vinatrust.bank.identity.internal.application;

import com.vinatrust.bank.identity.contracts.events.UserRegisteredEvent;
import com.vinatrust.bank.identity.internal.api.dto.AuthResponse;
import com.vinatrust.bank.identity.internal.api.dto.LoginRequest;
import com.vinatrust.bank.identity.internal.api.dto.RefreshTokenRequest;
import com.vinatrust.bank.identity.internal.api.dto.RegisterRequest;
import com.vinatrust.bank.identity.internal.api.dto.RegisterResponse;
import com.vinatrust.bank.identity.internal.api.dto.ResendVerificationRequest;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private final UserMapper userMapper = new UserMapper();

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                refreshTokenRepository,
                emailVerificationTokenRepository,
                passwordEncoder,
                jwtService,
                eventPublisher,
                userMapper,
                604800000L,
                15,
                5,
                60
        );
    }

    @Test
    @DisplayName("1. Đăng ký thành công: user có status=PENDING_VERIFICATION, emailVerified=false, phát EmailVerificationRequestedEvent, CHƯA phát UserRegisteredEvent")
    void register_Success() {
        RegisterRequest request = new RegisterRequest(
                "hoangnam",
                "nam@vinatrust.vn",
                "0909123456",
                "Nguyễn Hoàng Nam",
                "01/01/1995",
                "Password123!",
                "123456"
        );

        when(userRepository.existsByUsername(request.username())).thenReturn(false);
        when(userRepository.existsByEmail(request.email())).thenReturn(false);
        when(userRepository.existsByPhone(request.phone())).thenReturn(false);
        when(passwordEncoder.encode("Password123!")).thenReturn("hashedPassword");
        when(passwordEncoder.encode("123456")).thenReturn("hashedPin");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RegisterResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.email()).isEqualTo("nam@vinatrust.vn");
        assertThat(response.status()).isEqualTo("PENDING_VERIFICATION");

        // Verify User saved with correct attributes
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getStatus()).isEqualTo(UserStatus.PENDING_VERIFICATION);
        assertThat(savedUser.isEmailVerified()).isFalse();
        assertThat(savedUser.getRole()).isEqualTo(Role.CUSTOMER);

        // Verify EmailVerificationToken saved
        verify(emailVerificationTokenRepository).save(any(EmailVerificationToken.class));

        // Verify internal email event published
        verify(eventPublisher).publishEvent(any(EmailVerificationRequestedEvent.class));

        // Verify Integration Event UserRegisteredEvent is NOT yet published
        verify(eventPublisher, never()).publishEvent(any(UserRegisteredEvent.class));
    }

    @Test
    @DisplayName("2. Đăng nhập ngay khi chưa kích hoạt email bị chặn 403 BusinessRuleException")
    void login_WhenPendingVerification_ThrowsBusinessRuleException() {
        LoginRequest request = new LoginRequest("unverifiedUser", "Password123!");
        User user = new User(
                UUID.randomUUID(),
                "unverifiedUser",
                "unverified@vinatrust.vn",
                "0901234567",
                "Chưa Kích Hoạt",
                null,
                "hashedPassword",
                null,
                Role.CUSTOMER,
                UserStatus.PENDING_VERIFICATION,
                "UNVERIFIED",
                false,
                false,
                "STANDARD",
                null
        );

        when(userRepository.findByUsernameOrEmailOrPhone("unverifiedUser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password123!", "hashedPassword")).thenReturn(true);

        assertThatThrownBy(() -> authService.login(request, "Mobile"))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Tài khoản chưa được kích hoạt. Vui lòng xác thực email bằng mã OTP trước khi đăng nhập.");
    }

    @Test
    @DisplayName("3. Nhập sai OTP: tăng attempt_count và báo số lần thử còn lại; sai lần 5 bị khóa")
    void verifyEmail_WrongOtp_IncrementsAttemptAndBlocksAtMax() {
        UUID userId = UUID.randomUUID();
        User user = new User(
                userId,
                "user1",
                "user1@vinatrust.vn",
                "0901112222",
                "User 1",
                null,
                "passHash",
                null,
                Role.CUSTOMER,
                UserStatus.PENDING_VERIFICATION,
                "UNVERIFIED",
                false,
                false,
                "STANDARD",
                null
        );

        String correctHash = OtpUtil.hashSha256("123456");
        EmailVerificationToken token = new EmailVerificationToken(
                UUID.randomUUID(),
                userId,
                correctHash,
                Instant.now().plusSeconds(900),
                0,
                false,
                Instant.now()
        );

        when(userRepository.findByEmail("user1@vinatrust.vn")).thenReturn(Optional.of(user));
        when(emailVerificationTokenRepository.findLatestActiveByUserId(userId)).thenReturn(Optional.of(token));

        // Wrong OTP first time
        VerifyEmailRequest wrongRequest = new VerifyEmailRequest("user1@vinatrust.vn", "999999");
        assertThatThrownBy(() -> authService.verifyEmail(wrongRequest))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Mã OTP không chính xác. Bạn còn 4 lần thử.");

        assertThat(token.getAttemptCount()).isEqualTo(1);
        verify(emailVerificationTokenRepository).save(token);

        // When attempt reaches 5
        token.incrementAttempt();
        token.incrementAttempt();
        token.incrementAttempt();
        token.incrementAttempt(); // now attemptCount = 5

        assertThatThrownBy(() -> authService.verifyEmail(wrongRequest))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Mã OTP đã bị vô hiệu hóa do nhập sai quá 5 lần");
    }

    @Test
    @DisplayName("4. Nhập mã OTP đã hết hạn bị từ chối")
    void verifyEmail_ExpiredOtp_ThrowsBusinessRuleException() {
        UUID userId = UUID.randomUUID();
        User user = new User(
                userId,
                "user1",
                "user1@vinatrust.vn",
                "0901112222",
                "User 1",
                null,
                "passHash",
                null,
                Role.CUSTOMER,
                UserStatus.PENDING_VERIFICATION,
                "UNVERIFIED",
                false,
                false,
                "STANDARD",
                null
        );

        String correctHash = OtpUtil.hashSha256("123456");
        EmailVerificationToken expiredToken = new EmailVerificationToken(
                UUID.randomUUID(),
                userId,
                correctHash,
                Instant.now().minusSeconds(10), // expired 10s ago
                0,
                false,
                Instant.now().minusSeconds(1000)
        );

        when(userRepository.findByEmail("user1@vinatrust.vn")).thenReturn(Optional.of(user));
        when(emailVerificationTokenRepository.findLatestActiveByUserId(userId)).thenReturn(Optional.of(expiredToken));

        VerifyEmailRequest request = new VerifyEmailRequest("user1@vinatrust.vn", "123456");
        assertThatThrownBy(() -> authService.verifyEmail(request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Mã OTP đã hết hạn");
    }

    @Test
    @DisplayName("5. Nhập đúng OTP: user chuyển sang ACTIVE, emailVerified=true, phát UserRegisteredEvent")
    void verifyEmail_CorrectOtp_ActivatesUserAndPublishesEvent() {
        UUID userId = UUID.randomUUID();
        User user = new User(
                userId,
                "user1",
                "user1@vinatrust.vn",
                "0901112222",
                "User 1",
                null,
                "passHash",
                null,
                Role.CUSTOMER,
                UserStatus.PENDING_VERIFICATION,
                "UNVERIFIED",
                false,
                false,
                "STANDARD",
                null
        );

        String rawOtp = "654321";
        String correctHash = OtpUtil.hashSha256(rawOtp);
        EmailVerificationToken token = new EmailVerificationToken(
                UUID.randomUUID(),
                userId,
                correctHash,
                Instant.now().plusSeconds(900),
                0,
                false,
                Instant.now()
        );

        when(userRepository.findByEmail("user1@vinatrust.vn")).thenReturn(Optional.of(user));
        when(emailVerificationTokenRepository.findLatestActiveByUserId(userId)).thenReturn(Optional.of(token));

        VerifyEmailRequest request = new VerifyEmailRequest("user1@vinatrust.vn", rawOtp);
        authService.verifyEmail(request);

        assertThat(token.isUsed()).isTrue();
        assertThat(user.isEmailVerified()).isTrue();
        assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);

        verify(emailVerificationTokenRepository).save(token);
        verify(userRepository).save(user);

        // Verify UserRegisteredEvent is now published
        ArgumentCaptor<UserRegisteredEvent> eventCaptor = ArgumentCaptor.forClass(UserRegisteredEvent.class);
        verify(eventPublisher, times(1)).publishEvent(eventCaptor.capture());
        UserRegisteredEvent registeredEvent = eventCaptor.getValue();
        assertThat(registeredEvent.userId()).isEqualTo(userId);
        assertThat(registeredEvent.email()).isEqualTo("user1@vinatrust.vn");
        assertThat(registeredEvent.role()).isEqualTo("CUSTOMER");
    }

    @Test
    @DisplayName("6. Gửi lại mã: bị chặn trong vòng 60 giây cooldown; sau 60 giây vô hiệu hóa mã cũ và tạo mã mới")
    void resendVerification_CooldownAndSuccess() {
        UUID userId = UUID.randomUUID();
        User user = new User(
                userId,
                "user1",
                "user1@vinatrust.vn",
                "0901112222",
                "User 1",
                null,
                "passHash",
                null,
                Role.CUSTOMER,
                UserStatus.PENDING_VERIFICATION,
                "UNVERIFIED",
                false,
                false,
                "STANDARD",
                null
        );

        // Token created 20 seconds ago -> still within 60s cooldown
        EmailVerificationToken recentToken = new EmailVerificationToken(
                UUID.randomUUID(),
                userId,
                "hash1",
                Instant.now().plusSeconds(880),
                0,
                false,
                Instant.now().minusSeconds(20)
        );

        when(userRepository.findByEmail("user1@vinatrust.vn")).thenReturn(Optional.of(user));
        when(emailVerificationTokenRepository.findLatestActiveByUserId(userId)).thenReturn(Optional.of(recentToken));

        ResendVerificationRequest request = new ResendVerificationRequest("user1@vinatrust.vn");

        // Should throw cooldown exception
        assertThatThrownBy(() -> authService.resendVerification(request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Vui lòng chờ");

        // Token created 65 seconds ago -> cooldown passed
        EmailVerificationToken oldToken = new EmailVerificationToken(
                UUID.randomUUID(),
                userId,
                "hash1",
                Instant.now().plusSeconds(800),
                0,
                false,
                Instant.now().minusSeconds(65)
        );

        when(emailVerificationTokenRepository.findLatestActiveByUserId(userId)).thenReturn(Optional.of(oldToken));

        authService.resendVerification(request);

        // Verify invalidated old tokens and created new token
        verify(emailVerificationTokenRepository).invalidateAllByUserId(userId);
        verify(emailVerificationTokenRepository).save(any(EmailVerificationToken.class));
        verify(eventPublisher).publishEvent(any(EmailVerificationRequestedEvent.class));
    }

    @Test
    @DisplayName("7. Đăng nhập thành công sau khi tài khoản đã kích hoạt (ACTIVE + emailVerified=true)")
    void login_Success_WhenActiveAndVerified() {
        LoginRequest request = new LoginRequest("activeUser", "Password123!");
        User user = new User(
                UUID.randomUUID(),
                "activeUser",
                "active@vinatrust.vn",
                "0901234567",
                "Đã Kích Hoạt",
                "15/08/1994",
                "hashedPassword",
                "hashedPin",
                Role.CUSTOMER,
                UserStatus.ACTIVE,
                "VERIFIED",
                false,
                true, // emailVerified = true
                "STANDARD",
                null
        );

        when(userRepository.findByUsernameOrEmailOrPhone("activeUser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password123!", "hashedPassword")).thenReturn(true);
        when(jwtService.generateAccessToken(any(), anyString(), anyString())).thenReturn("new-access-token");
        when(jwtService.generateOpaqueRefreshToken()).thenReturn("new-refresh-token");

        AuthResponse response = authService.login(request, "Web Chrome");

        assertThat(response.accessToken()).isEqualTo("new-access-token");
        assertThat(response.refreshToken()).isEqualTo("new-refresh-token");
        assertThat(response.user().username()).isEqualTo("activeUser");
    }

    @Test
    @DisplayName("8. Xoay vòng Refresh Token thành công")
    void refreshToken_Success_RotatesToken() {
        User user = new User(
                UUID.randomUUID(),
                "customer1",
                "quy.nguyen@vinatrust.vn",
                "0901234567",
                "Quý Nguyễn",
                null,
                "hashedPassword",
                null,
                Role.CUSTOMER,
                UserStatus.ACTIVE,
                "VERIFIED",
                false,
                true,
                "STANDARD",
                null
        );
        RefreshToken oldToken = new RefreshToken(
                UUID.randomUUID(),
                user,
                "valid-refresh-token",
                Instant.now().plusSeconds(3600),
                "Device"
        );

        when(refreshTokenRepository.findByToken("valid-refresh-token")).thenReturn(Optional.of(oldToken));
        when(jwtService.generateAccessToken(any(), anyString(), anyString())).thenReturn("new-jwt");
        when(jwtService.generateOpaqueRefreshToken()).thenReturn("rotated-refresh-token");

        AuthResponse response = authService.refreshToken(new RefreshTokenRequest("valid-refresh-token"), "Device");

        assertThat(oldToken.isRevoked()).isTrue();
        assertThat(response.refreshToken()).isEqualTo("rotated-refresh-token");
        verify(refreshTokenRepository, times(2)).save(any(RefreshToken.class));
    }
}
