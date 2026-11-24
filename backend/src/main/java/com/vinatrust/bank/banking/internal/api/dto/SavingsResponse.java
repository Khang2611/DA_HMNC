package com.vinatrust.bank.banking.internal.api.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record SavingsResponse(
    UUID id,
    UUID userId,
    UUID sourceAccountId,
    BigDecimal principalAmount,
    int termMonths,
    BigDecimal interestRate,
    String status,
    Instant openedAt,
    Instant maturityDate
) {
}

