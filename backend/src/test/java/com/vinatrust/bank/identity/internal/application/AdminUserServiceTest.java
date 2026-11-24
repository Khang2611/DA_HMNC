package com.vinatrust.bank.identity.internal.application;

import com.vinatrust.bank.identity.contracts.events.UserRoleChangedEvent;
import com.vinatrust.bank.identity.internal.api.dto.UpdateUserRoleRequest;
import com.vinatrust.bank.identity.internal.api.dto.UserProfileResponse;
import com.vinatrust.bank.identity.internal.application.mapper.UserMapper;
import com.vinatrust.bank.identity.internal.domain.RefreshTokenRepository;
import com.vinatrust.bank.identity.internal.domain.Role;
import com.vinatrust.bank.identity.internal.domain.User;
import com.vinatrust.bank.identity.internal.domain.UserRepository;
import com.vinatrust.bank.identity.internal.domain.UserStatus;
import com.vinatrust.bank.shared.exception.BusinessRuleException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private final UserMapper userMapper = new UserMapper();

    private AdminUserService adminUserService;

    private UUID currentAdminId;
    private UUID targetUserId;
    private User customerUser;

    @BeforeEach
    void setUp() {
        adminUserService = new AdminUserService(
                userRepository,
                refreshTokenRepository,
                eventPublisher,
                userMapper
        );

        currentAdminId = UUID.randomUUID();
        targetUserId = UUID.randomUUID();

        customerUser = new User(
                targetUserId,
                "customer_test",
                "customer@vinatrust.vn",
                "0911223344",
                "Khách Hàng Test",
                "01/01/1995",
                "hash",
                null,
                Role.CUSTOMER,
                UserStatus.ACTIVE,
                "UNVERIFIED",
                false,
                "STANDARD",
                null
        );
    }

    @Test
    @DisplayName("Admin đổi role CUSTOMER -> AGENT kèm assignedTeam thành công và thu hồi toàn bộ Refresh Token")
    void updateUserRole_CustomerToAgent_Success() {
        UpdateUserRoleRequest request = new UpdateUserRoleRequest(
                Role.AGENT,
                "An ninh và gian lận"
        );

        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(customerUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        UserProfileResponse response = adminUserService.updateUserRole(targetUserId, request, currentAdminId);

        assertThat(response).isNotNull();
        assertThat(response.role()).isEqualTo("AGENT");
        assertThat(response.assignedTeam()).isEqualTo("An ninh và gian lận");
        assertThat(response.customerTier()).isNull();

        // Verify all refresh tokens revoked
        verify(refreshTokenRepository, times(1)).revokeAllByUserId(targetUserId);

        // Verify UserRoleChangedEvent published
        ArgumentCaptor<UserRoleChangedEvent> eventCaptor = ArgumentCaptor.forClass(UserRoleChangedEvent.class);
        verify(eventPublisher, times(1)).publishEvent(eventCaptor.capture());
        UserRoleChangedEvent publishedEvent = eventCaptor.getValue();
        assertThat(publishedEvent.userId()).isEqualTo(targetUserId);
        assertThat(publishedEvent.oldRole()).isEqualTo("CUSTOMER");
        assertThat(publishedEvent.newRole()).isEqualTo("AGENT");
        assertThat(publishedEvent.assignedTeam()).isEqualTo("An ninh và gian lận");
        assertThat(publishedEvent.changedByAdminId()).isEqualTo(currentAdminId);
    }

    @Test
    @DisplayName("Chặn Admin tự hạ quyền của chính mình")
    void updateUserRole_AdminSelfDemotion_ThrowsBusinessRuleException() {
        UpdateUserRoleRequest request = new UpdateUserRoleRequest(
                Role.CUSTOMER,
                null
        );

        assertThatThrownBy(() -> adminUserService.updateUserRole(currentAdminId, request, currentAdminId))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Quản trị viên không được phép tự hạ quyền của chính mình");

        verify(userRepository, never()).save(any());
        verify(refreshTokenRepository, never()).revokeAllByUserId(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("Đổi sang AGENT nhưng không chỉ định assignedTeam bị ném BusinessRuleException")
    void updateUserRole_AgentWithoutTeam_ThrowsBusinessRuleException() {
        UpdateUserRoleRequest request = new UpdateUserRoleRequest(
                Role.AGENT,
                null
        );

        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(customerUser));

        assertThatThrownBy(() -> adminUserService.updateUserRole(targetUserId, request, currentAdminId))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("bắt buộc phải được phân công vào một đội chuyên trách");

        verify(userRepository, never()).save(any());
        verify(refreshTokenRepository, never()).revokeAllByUserId(any());
    }

    @Test
    @DisplayName("Đổi sang AGENT với đội không thuộc 6 đội cho phép bị ném BusinessRuleException")
    void updateUserRole_AgentWithInvalidTeam_ThrowsBusinessRuleException() {
        UpdateUserRoleRequest request = new UpdateUserRoleRequest(
                Role.AGENT,
                "Đội IT Tự Do"
        );

        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(customerUser));

        assertThatThrownBy(() -> adminUserService.updateUserRole(targetUserId, request, currentAdminId))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Đội chuyên trách không hợp lệ. Phải thuộc 1 trong 6 đội");

        verify(userRepository, never()).save(any());
    }
}

