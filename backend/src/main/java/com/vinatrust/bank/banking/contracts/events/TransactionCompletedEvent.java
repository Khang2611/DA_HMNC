package com.vinatrust.bank.banking.contracts.events;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TransactionCompletedEvent(
    UUID transactionId,
    String referenceCode,
    UUID fromAccountId,
    String toAccountNumber,
    String toBankCode,
    BigDecimal amount,
    BigDecimal fee,
    String transferChannel,
    String status,
    Instant completedAt
) {
}

