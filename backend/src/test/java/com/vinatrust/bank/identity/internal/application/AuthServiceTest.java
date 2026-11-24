package com.vinatrust.bank.identity.internal.application;

import com.vinatrust.bank.identity.contracts.events.UserRegisteredEvent;
import com.vinatrust.bank.identity.internal.api.dto.AuthResponse;
import com.vinatrust.bank.identity.internal.api.dto.LoginRequest;
import com.vinatrust.bank.identity.internal.api.dto.RefreshTokenRequest;
import com.vinatrust.bank.identity.internal.api.dto.RegisterRequest;
import com.vinatrust.bank.identity.internal.application.mapper.UserMapper;
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
                passwordEncoder,
                jwtService,
                eventPublisher,
                userMapper,
                604800000L
        );
    }

    @Test
    @DisplayName("Đăng ký thành công: phát UserRegisteredEvent và trả AuthResponse hợp lệ")
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
        when(jwtService.generateAccessToken(any(), anyString(), anyString())).thenReturn("mock-access-token");
        when(jwtService.generateOpaqueRefreshToken()).thenReturn("mock-refresh-token");
        when(jwtService.getAccessTokenExpirationMs()).thenReturn(900000L);

        AuthResponse response = authService.register(request, "Mobile iPhone 15");

        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isEqualTo("mock-access-token");
        assertThat(response.refreshToken()).isEqualTo("mock-refresh-token");
        assertThat(response.user().username()).isEqualTo("hoangnam");
        assertThat(response.user().role()).isEqualTo("CUSTOMER");

        // Verify UserRegisteredEvent was published
        ArgumentCaptor<UserRegisteredEvent> eventCaptor = ArgumentCaptor.forClass(UserRegisteredEvent.class);
        verify(eventPublisher, times(1)).publishEvent(eventCaptor.capture());
        UserRegisteredEvent publishedEvent = eventCaptor.getValue();
        assertThat(publishedEvent.username()).isEqualTo("hoangnam");
        assertThat(publishedEvent.email()).isEqualTo("nam@vinatrust.vn");
        assertThat(publishedEvent.role()).isEqualTo("CUSTOMER");
    }

    @Test
    @DisplayName("Đăng ký thất bại khi trùng tên đăng nhập")
    void register_DuplicateUsername_ThrowsBusinessRuleException() {
        RegisterRequest request = new RegisterRequest(
                "customer1",
                "new@vinatrust.vn",
                "0909111222",
                "Tên Test",
                "01/01/1990",
                "Password123!",
                "123456"
        );

        when(userRepository.existsByUsername("customer1")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request, "Test Device"))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Tên đăng nhập 'customer1' đã được sử dụng");

        verify(userRepository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("Đăng nhập thành công với mật khẩu đúng")
    void login_Success() {
        LoginRequest request = new LoginRequest("customer1", "Password123!");
        User user = new User(
                UUID.randomUUID(),
                "customer1",
                "quy.nguyen@mauvebank.vn",
                "0901234567",
                "Quý Nguyễn",
                "15/08/1994",
                "hashedPassword",
                "hashedPin",
                Role.CUSTOMER,
                UserStatus.ACTIVE,
                "VERIFIED",
                "Mauve Premier"
        );

        when(userRepository.findByUsernameOrEmailOrPhone("customer1")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password123!", "hashedPassword")).thenReturn(true);
        when(jwtService.generateAccessToken(any(), anyString(), anyString())).thenReturn("new-access-token");
        when(jwtService.generateOpaqueRefreshToken()).thenReturn("new-refresh-token");

        AuthResponse response = authService.login(request, "Web Chrome");

        assertThat(response.accessToken()).isEqualTo("new-access-token");
        assertThat(response.refreshToken()).isEqualTo("new-refresh-token");
        assertThat(response.user().username()).isEqualTo("customer1");
    }

    @Test
    @DisplayName("Đăng nhập thất bại khi mật khẩu sai")
    void login_WrongPassword_ThrowsBadCredentialsException() {
        LoginRequest request = new LoginRequest("customer1", "WrongPass!");
        User user = new User(
                UUID.randomUUID(),
                "customer1",
                "email@test.vn",
                "0901234567",
                "Test",
                null,
                "hashedPassword",
                null,
                Role.CUSTOMER,
                UserStatus.ACTIVE,
                "UNVERIFIED",
                "STANDARD"
        );

        when(userRepository.findByUsernameOrEmailOrPhone("customer1")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("WrongPass!", "hashedPassword")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request, "Device"))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Thông tin đăng nhập không chính xác");
    }

    @Test
    @DisplayName("Xoay vòng Refresh Token thành công")
    void refreshToken_Success_RotatesToken() {
        User user = new User(
                UUID.randomUUID(),
                "customer1",
                "quy.nguyen@mauvebank.vn",
                "0901234567",
                "Quý Nguyễn",
                null,
                "hashedPassword",
                null,
                Role.CUSTOMER,
                UserStatus.ACTIVE,
                "VERIFIED",
                "STANDARD"
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

