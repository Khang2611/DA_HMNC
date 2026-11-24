package com.vinatrust.bank.identity.internal.domain;

import java.util.Optional;
import java.util.UUID;

public interface EmailVerificationTokenRepository {

    EmailVerificationToken save(EmailVerificationToken token);

    Optional<EmailVerificationToken> findLatestActiveByUserId(UUID userId);

    void invalidateAllByUserId(UUID userId);
}

