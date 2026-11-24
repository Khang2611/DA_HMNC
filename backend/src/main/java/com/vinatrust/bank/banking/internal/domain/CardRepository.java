package com.vinatrust.bank.banking.internal.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CardRepository {

    Optional<Card> findById(UUID id);

    List<Card> findByUserId(UUID userId);

    List<Card> findByAccountId(UUID accountId);

    Card save(Card card);
}

