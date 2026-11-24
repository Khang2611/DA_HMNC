package com.vinatrust.bank.identity.contracts.events;

import java.time.Instant;
import java.util.UUID;

public record UserRoleChangedEvent(
    UUID userId,
    String oldRole,
    String newRole,
    String assignedTeam,
    UUID changedByAdminId,
    Instant occurredAt
) {
}

