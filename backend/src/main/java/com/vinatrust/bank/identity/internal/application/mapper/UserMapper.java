package com.vinatrust.bank.identity.internal.application.mapper;

import com.vinatrust.bank.identity.contracts.dto.UserSummaryDto;
import com.vinatrust.bank.identity.internal.api.dto.UserProfileResponse;
import com.vinatrust.bank.identity.internal.domain.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserSummaryDto toUserSummaryDto(User user) {
        if (user == null) return null;
        return new UserSummaryDto(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().name(),
                user.getStatus().name(),
                user.getKycStatus(),
                user.getCustomerTier(),
                user.isKycBiometricVerified()
        );
    }

    public UserProfileResponse toUserProfileResponse(User user) {
        if (user == null) return null;
        return new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getDateOfBirth(),
                user.getRole().name(),
                user.getStatus().name(),
                user.getKycStatus(),
                user.isKycBiometricVerified(),
                user.getCustomerTier(),
                user.getAssignedTeam(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
