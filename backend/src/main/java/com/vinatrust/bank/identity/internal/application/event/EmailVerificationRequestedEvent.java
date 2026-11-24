package com.vinatrust.bank.identity.internal.application.event;

public record EmailVerificationRequestedEvent(
        String email,
        String fullName,
        String otpCode,
        int expirationMinutes
) {
}

