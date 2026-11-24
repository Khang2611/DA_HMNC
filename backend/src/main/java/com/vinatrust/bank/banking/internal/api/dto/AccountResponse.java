package com.vinatrust.bank.banking.internal.api.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AccountResponse(
    UUID id,
    UUID userId,
    String accountNumber,
    BigDecimal balance,
    BigDecimal dailyLimit,
    String currency,
    String status,
    Instant createdAt
) {
}

