package com.vinatrust.bank.banking.internal.infrastructure.persistence;

import com.vinatrust.bank.banking.internal.domain.Card;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface JpaCardRepository extends JpaRepository<Card, UUID> {

    List<Card> findByUserId(UUID userId);

    List<Card> findByAccountId(UUID accountId);
}

