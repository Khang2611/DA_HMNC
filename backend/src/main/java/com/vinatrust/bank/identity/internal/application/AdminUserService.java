package com.vinatrust.bank.identity.internal.application;

import com.vinatrust.bank.identity.contracts.events.UserRoleChangedEvent;
import com.vinatrust.bank.identity.internal.api.dto.UpdateUserRoleRequest;
import com.vinatrust.bank.identity.internal.api.dto.UserProfileResponse;
import com.vinatrust.bank.identity.internal.application.mapper.UserMapper;
import com.vinatrust.bank.identity.internal.domain.RefreshTokenRepository;
import com.vinatrust.bank.identity.internal.domain.Role;
import com.vinatrust.bank.identity.internal.domain.User;
import com.vinatrust.bank.identity.internal.domain.UserRepository;
import com.vinatrust.bank.shared.exception.BusinessRuleException;
import com.vinatrust.bank.shared.exception.ResourceNotFoundException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@Service
public class AdminUserService {

    public static final Set<String> ALLOWED_TEAMS = Set.of(
            "An ninh và gian lận",
            "Chuyển tiền và tra soát",
            "Thẻ và thanh toán",
            "Ngân hàng số",
            "Tài khoản",
            "Chăm sóc chung"
    );

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final UserMapper userMapper;

    public AdminUserService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            ApplicationEventPublisher eventPublisher,
            UserMapper userMapper
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.eventPublisher = eventPublisher;
        this.userMapper = userMapper;
    }

    @Transactional(readOnly = true)
    public Page<UserProfileResponse> getUsers(Role role, String keyword, Pageable pageable) {
        String cleanKeyword = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
        return userRepository.findUsers(role, cleanKeyword, pageable)
                .map(userMapper::toUserProfileResponse);
    }

    @Transactional
    public UserProfileResponse updateUserRole(UUID targetUserId, UpdateUserRoleRequest request, UUID currentAdminId) {
        // 1. Security invariant: Admin cannot demote themselves
        if (targetUserId.equals(currentAdminId) && request.role() != Role.ADMIN) {
            throw new BusinessRuleException("Quản trị viên không được phép tự hạ quyền của chính mình");
        }

        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));

        Role oldRole = user.getRole();
        Role newRole = request.role();

        // 2. Validate role-specific business constraints
        if (newRole == Role.AGENT || newRole == Role.TEAM_LEAD) {
            if (request.assignedTeam() == null || request.assignedTeam().isBlank()) {
                throw new BusinessRuleException(
                        "Nhân viên hoặc Trưởng nhóm bắt buộc phải được phân công vào một đội chuyên trách");
            }
            String team = request.assignedTeam().trim();
            if (!ALLOWED_TEAMS.contains(team)) {
                throw new BusinessRuleException(
                        "Đội chuyên trách không hợp lệ. Phải thuộc 1 trong 6 đội: " + String.join(", ", ALLOWED_TEAMS));
            }
            user.changeRole(newRole, team, null);
        } else if (newRole == Role.CUSTOMER) {
            String customerTier = user.getCustomerTier() != null ? user.getCustomerTier() : "STANDARD";
            user.changeRole(Role.CUSTOMER, null, customerTier);
        } else if (newRole == Role.ADMIN) {
            user.changeRole(Role.ADMIN, null, null);
        }

        User savedUser = userRepository.save(user);

        // 3. Security enforcement: Revoke all active refresh tokens of the user
        refreshTokenRepository.revokeAllByUserId(targetUserId);

        // 4. Publish Integration Event
        eventPublisher.publishEvent(new UserRoleChangedEvent(
                savedUser.getId(),
                oldRole.name(),
                newRole.name(),
                savedUser.getAssignedTeam(),
                currentAdminId,
                Instant.now()
        ));

        return userMapper.toUserProfileResponse(savedUser);
    }
}
