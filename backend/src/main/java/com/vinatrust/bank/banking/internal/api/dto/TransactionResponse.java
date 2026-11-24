package com.vinatrust.bank.banking.internal.api.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TransactionResponse(
    UUID id,
    String referenceCode,
    UUID fromAccountId,
    String toAccountNumber,
    String toBankCode,
    BigDecimal amount,
    BigDecimal fee,
    String transferChannel,
    String authMethod,
    String description,
    String status,
    Instant createdAt
) {
}

