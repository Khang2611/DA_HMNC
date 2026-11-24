package com.vinatrust.bank.banking.contracts.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record AccountOverviewDto(
    UUID accountId,
    UUID userId,
    String accountNumber,
    BigDecimal balance,
    BigDecimal dailyLimit,
    String currency,
    String status
) {
}

