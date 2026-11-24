package com.vinatrust.bank.identity.internal.infrastructure.persistence;

import com.vinatrust.bank.identity.internal.domain.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface JpaEmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, UUID> {

    Optional<EmailVerificationToken> findFirstByUserIdAndUsedFalseOrderByCreatedAtDesc(UUID userId);

    @Modifying
    @Query("UPDATE EmailVerificationToken t SET t.used = true WHERE t.userId = :userId AND t.used = false")
    void invalidateAllByUserId(@Param("userId") UUID userId);
}

