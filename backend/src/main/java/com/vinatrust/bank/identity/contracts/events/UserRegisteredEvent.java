package com.vinatrust.bank.identity.contracts.events;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain/Integration Event published when a new user registers successfully.
 * Other modules (e.g. banking/accounts) listen to this event to provision default accounts.
 */
public record UserRegisteredEvent(
    UUID userId,
    String username,
    String email,
    String fullName,
    String phone,
    String role,
    Instant occurredAt
) {
}

