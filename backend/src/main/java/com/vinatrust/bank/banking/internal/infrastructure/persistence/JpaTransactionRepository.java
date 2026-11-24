package com.vinatrust.bank.banking.internal.infrastructure.persistence;

import com.vinatrust.bank.banking.internal.domain.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JpaTransactionRepository extends JpaRepository<Transaction, UUID> {

    Optional<Transaction> findByReferenceCode(String referenceCode);

    List<Transaction> findByFromAccountId(UUID accountId);

    List<Transaction> findByFromAccountIdOrderByCreatedAtDesc(UUID accountId);
}

