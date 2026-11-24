package com.vinatrust.bank.banking.internal.api.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CardResponse(
    UUID id,
    UUID userId,
    UUID accountId,
    String cardNumberMasked,
    String cardLast4,
    String cardType,
    boolean isVirtual,
    BigDecimal creditLimit,
    String status,
    Instant expiredAt,
    Instant createdAt
) {
}

