package com.vinatrust.bank.identity.internal.domain;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository {

    Optional<RefreshToken> findByToken(String token);

    RefreshToken save(RefreshToken refreshToken);

    void revokeAllByUserId(UUID userId);
}

