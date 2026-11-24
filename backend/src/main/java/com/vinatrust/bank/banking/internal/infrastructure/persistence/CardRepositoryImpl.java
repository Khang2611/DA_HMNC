package com.vinatrust.bank.banking.internal.infrastructure.persistence;

import com.vinatrust.bank.banking.internal.domain.Card;
import com.vinatrust.bank.banking.internal.domain.CardRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class CardRepositoryImpl implements CardRepository {

    private final JpaCardRepository jpaCardRepository;

    public CardRepositoryImpl(JpaCardRepository jpaCardRepository) {
        this.jpaCardRepository = jpaCardRepository;
    }

    @Override
    public Optional<Card> findById(UUID id) {
        return jpaCardRepository.findById(id);
    }

    @Override
    public List<Card> findByUserId(UUID userId) {
        return jpaCardRepository.findByUserId(userId);
    }

    @Override
    public List<Card> findByAccountId(UUID accountId) {
        return jpaCardRepository.findByAccountId(accountId);
    }

    @Override
    public Card save(Card card) {
        return jpaCardRepository.save(card);
    }
}

