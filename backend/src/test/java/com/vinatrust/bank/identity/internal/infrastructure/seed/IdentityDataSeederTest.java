package com.vinatrust.bank.identity.internal.infrastructure.seed;

import com.vinatrust.bank.identity.internal.domain.Role;
import com.vinatrust.bank.identity.internal.domain.User;
import com.vinatrust.bank.identity.internal.domain.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IdentityDataSeederTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private IdentityDataSeeder seeder;

    @BeforeEach
    void setUp() {
        seeder = new IdentityDataSeeder(userRepository, passwordEncoder);
        ReflectionTestUtils.setField(seeder, "adminUsername", "admin");
        ReflectionTestUtils.setField(seeder, "adminPassword", "VinaTrustAdmin@2026");
        ReflectionTestUtils.setField(seeder, "adminEmail", "admin@vinatrust.vn");
        ReflectionTestUtils.setField(seeder, "adminPhone", "0900000001");
    }

    @Test
    @DisplayName("Khởi tạo duy nhất 1 tài khoản ADMIN khi chưa tồn tại")
    void run_WhenNoAdminExists_ShouldSeedSingleAdmin() {
        when(userRepository.existsByRole(Role.ADMIN)).thenReturn(false);
        when(userRepository.existsByUsername("admin")).thenReturn(false);
        when(passwordEncoder.encode("VinaTrustAdmin@2026")).thenReturn("hashedAdminPass");

        seeder.run();

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(userCaptor.capture());

        User seededAdmin = userCaptor.getValue();
        assertThat(seededAdmin.getUsername()).isEqualTo("admin");
        assertThat(seededAdmin.getEmail()).isEqualTo("admin@vinatrust.vn");
        assertThat(seededAdmin.getPhone()).isEqualTo("0900000001");
        assertThat(seededAdmin.getRole()).isEqualTo(Role.ADMIN);
        assertThat(seededAdmin.isKycBiometricVerified()).isTrue();
        assertThat(seededAdmin.getCustomerTier()).isNull();
        assertThat(seededAdmin.getAssignedTeam()).isNull();
    }

    @Test
    @DisplayName("Idempotent: Chạy lần thứ 2 không tạo thêm ADMIN nếu đã tồn tại")
    void run_WhenAdminAlreadyExists_ShouldSkipSeeding() {
        when(userRepository.existsByRole(Role.ADMIN)).thenReturn(true);

        seeder.run();

        verify(userRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(anyString());
    }
}
