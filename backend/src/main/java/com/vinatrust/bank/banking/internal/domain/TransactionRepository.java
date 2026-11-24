package com.vinatrust.bank.banking.internal.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TransactionRepository {

    Optional<Transaction> findById(UUID id);

    Optional<Transaction> findByReferenceCode(String referenceCode);

    List<Transaction> findByFromAccountId(UUID accountId);

    List<Transaction> findByFromAccountIdOrderByCreatedAtDesc(UUID accountId);

    Transaction save(Transaction transaction);
}

