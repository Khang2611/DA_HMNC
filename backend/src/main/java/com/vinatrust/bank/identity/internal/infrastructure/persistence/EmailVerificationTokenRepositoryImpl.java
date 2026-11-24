package com.vinatrust.bank.identity.internal.infrastructure.persistence;

import com.vinatrust.bank.identity.internal.domain.EmailVerificationToken;
import com.vinatrust.bank.identity.internal.domain.EmailVerificationTokenRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public class EmailVerificationTokenRepositoryImpl implements EmailVerificationTokenRepository {

    private final JpaEmailVerificationTokenRepository jpaRepository;

    public EmailVerificationTokenRepositoryImpl(JpaEmailVerificationTokenRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public EmailVerificationToken save(EmailVerificationToken token) {
        return jpaRepository.save(token);
    }

    @Override
    public Optional<EmailVerificationToken> findLatestActiveByUserId(UUID userId) {
        return jpaRepository.findFirstByUserIdAndUsedFalseOrderByCreatedAtDesc(userId);
    }

    @Override
    public void invalidateAllByUserId(UUID userId) {
        jpaRepository.invalidateAllByUserId(userId);
    }
}

