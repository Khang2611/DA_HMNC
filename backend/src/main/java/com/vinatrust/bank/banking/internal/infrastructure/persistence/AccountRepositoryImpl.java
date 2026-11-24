package com.vinatrust.bank.banking.internal.infrastructure.persistence;

import com.vinatrust.bank.banking.internal.domain.Account;
import com.vinatrust.bank.banking.internal.domain.AccountRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class AccountRepositoryImpl implements AccountRepository {

    private final JpaAccountRepository jpaAccountRepository;

    public AccountRepositoryImpl(JpaAccountRepository jpaAccountRepository) {
        this.jpaAccountRepository = jpaAccountRepository;
    }

    @Override
    public Optional<Account> findById(UUID id) {
        return jpaAccountRepository.findById(id);
    }

    @Override
    public Optional<Account> findByIdForUpdate(UUID id) {
        return jpaAccountRepository.findByIdForUpdate(id);
    }

    @Override
    public Optional<Account> findByAccountNumber(String accountNumber) {
        return jpaAccountRepository.findByAccountNumber(accountNumber);
    }

    @Override
    public Optional<Account> findByAccountNumberForUpdate(String accountNumber) {
        return jpaAccountRepository.findByAccountNumberForUpdate(accountNumber);
    }

    @Override
    public List<Account> findByUserId(UUID userId) {
        return jpaAccountRepository.findByUserId(userId);
    }

    @Override
    public boolean existsByAccountNumber(String accountNumber) {
        return jpaAccountRepository.existsByAccountNumber(accountNumber);
    }

    @Override
    public Account save(Account account) {
        return jpaAccountRepository.save(account);
    }
}

