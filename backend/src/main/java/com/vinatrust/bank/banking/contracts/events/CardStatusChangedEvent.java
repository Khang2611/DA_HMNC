package com.vinatrust.bank.banking.contracts.events;

import java.time.Instant;
import java.util.UUID;

public record CardStatusChangedEvent(
    UUID cardId,
    UUID userId,
    String oldStatus,
    String newStatus,
    String reason,
    Instant changedAt
) {
}

