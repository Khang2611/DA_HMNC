package com.vinatrust.bank.banking.internal.api.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TransferResponse(
    UUID transactionId,
    String referenceCode,
    String fromAccountNumber,
    String toAccountNumber,
    String toBankCode,
    BigDecimal amount,
    BigDecimal fee,
    String description,
    String status,
    BigDecimal remainingBalance,
    Instant createdAt
) {
}

