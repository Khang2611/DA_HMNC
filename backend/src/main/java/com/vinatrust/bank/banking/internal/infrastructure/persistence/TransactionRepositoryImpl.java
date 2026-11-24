package com.vinatrust.bank.banking.internal.infrastructure.persistence;

import com.vinatrust.bank.banking.internal.domain.Transaction;
import com.vinatrust.bank.banking.internal.domain.TransactionRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class TransactionRepositoryImpl implements TransactionRepository {

    private final JpaTransactionRepository jpaTransactionRepository;

    public TransactionRepositoryImpl(JpaTransactionRepository jpaTransactionRepository) {
        this.jpaTransactionRepository = jpaTransactionRepository;
    }

    @Override
    public Optional<Transaction> findById(UUID id) {
        return jpaTransactionRepository.findById(id);
    }

    @Override
    public Optional<Transaction> findByReferenceCode(String referenceCode) {
        return jpaTransactionRepository.findByReferenceCode(referenceCode);
    }

    @Override
    public List<Transaction> findByFromAccountId(UUID accountId) {
        return jpaTransactionRepository.findByFromAccountId(accountId);
    }

    @Override
    public List<Transaction> findByFromAccountIdOrderByCreatedAtDesc(UUID accountId) {
        return jpaTransactionRepository.findByFromAccountIdOrderByCreatedAtDesc(accountId);
    }

    @Override
    public Transaction save(Transaction transaction) {
        return jpaTransactionRepository.save(transaction);
    }
}

