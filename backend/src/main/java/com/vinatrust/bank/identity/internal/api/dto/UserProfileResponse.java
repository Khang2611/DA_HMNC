package com.vinatrust.bank.identity.internal.api.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Detailed profile response matching frontend UserProfile specifications.
 */
public record UserProfileResponse(
        UUID id,
        String username,
        String fullName,
        String email,
        String phoneNumber,
        String dateOfBirth,
        String role,
        String status,
        String kycStatus,
        boolean kycBiometricVerified,
        String customerTier,
        String assignedTeam,
        Instant createdAt,
        Instant updatedAt
) {
}
