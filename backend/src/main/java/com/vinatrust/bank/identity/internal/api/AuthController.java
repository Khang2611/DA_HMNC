package com.vinatrust.bank.identity.internal.api;

import com.vinatrust.bank.identity.internal.api.dto.AuthResponse;
import com.vinatrust.bank.identity.internal.api.dto.LoginRequest;
import com.vinatrust.bank.identity.internal.api.dto.RefreshTokenRequest;
import com.vinatrust.bank.identity.internal.api.dto.RegisterRequest;
import com.vinatrust.bank.identity.internal.api.dto.RegisterResponse;
import com.vinatrust.bank.identity.internal.api.dto.ResendVerificationRequest;
import com.vinatrust.bank.identity.internal.api.dto.UserProfileResponse;
import com.vinatrust.bank.identity.internal.api.dto.VerifyEmailRequest;
import com.vinatrust.bank.identity.internal.application.AuthService;
import com.vinatrust.bank.shared.api.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegisterResponse>> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        RegisterResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký tài khoản thành công", response));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(
            @Valid @RequestBody VerifyEmailRequest request
    ) {
        authService.verifyEmail(request);
        return ResponseEntity.ok(ApiResponse.success("Xác thực email và kích hoạt tài khoản thành công", null));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<Void>> resendVerification(
            @Valid @RequestBody ResendVerificationRequest request
    ) {
        authService.resendVerification(request);
        return ResponseEntity.ok(ApiResponse.success("Mã OTP xác thực mới đã được gửi vào email của bạn", null));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            @RequestHeader(value = "User-Agent", defaultValue = "Unknown Device") String userAgent
    ) {
        AuthResponse response = authService.login(request, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request,
            @RequestHeader(value = "User-Agent", defaultValue = "Unknown Device") String userAgent
    ) {
        AuthResponse response = authService.refreshToken(request, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Làm mới token thành công", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestBody(required = false) RefreshTokenRequest request
    ) {
        authService.logout(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", null));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getCredentials() instanceof UUID userId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Chưa xác thực"));
        }

        UserProfileResponse response = authService.getCurrentUserProfile(userId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin tài khoản thành công", response));
    }
}
