package com.vinatrust.bank.identity.internal.api.dto;

import com.vinatrust.bank.identity.contracts.dto.UserSummaryDto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn,
        UserSummaryDto user
) {
}

