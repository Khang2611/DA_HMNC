package com.vinatrust.bank.identity.contracts.dto;

import java.util.UUID;

/**
 * Public contract representation of a User for inter-module synchronous communication.
 * Strictly avoids exposing security-sensitive fields (such as passwordHash or pinHash).
 */
public record UserSummaryDto(
    UUID id,
    String username,
    String fullName,
    String email,
    String phone,
    String role,
    String status,
    String kycStatus,
    String customerTier,
    boolean kycBiometricVerified
) {
}
