package com.vinatrust.bank.banking.internal.api.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record LoanResponse(
    UUID id,
    UUID userId,
    String loanType,
    BigDecimal requestedAmount,
    int termMonths,
    BigDecimal interestRate,
    BigDecimal collateralValue,
    BigDecimal monthlyIncome,
    String status,
    Instant createdAt
) {
}

