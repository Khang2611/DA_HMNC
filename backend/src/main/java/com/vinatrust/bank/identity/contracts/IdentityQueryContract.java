package com.vinatrust.bank.identity.contracts;

import com.vinatrust.bank.identity.contracts.dto.UserSummaryDto;

import java.util.Optional;
import java.util.UUID;

/**
 * Public synchronous contract interface for querying user information across modules.
 */
public interface IdentityQueryContract {

    Optional<UserSummaryDto> findUserById(UUID userId);

    Optional<UserSummaryDto> findUserByUsername(String username);

    Optional<UserSummaryDto> findUserByPhone(String phone);

    boolean existsById(UUID userId);
}

