package com.vinatrust.bank.banking.internal.infrastructure.persistence;

import com.vinatrust.bank.banking.internal.domain.SavingsAccount;
import com.vinatrust.bank.banking.internal.domain.SavingsAccountRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class SavingsAccountRepositoryImpl implements SavingsAccountRepository {

    private final JpaSavingsAccountRepository jpaSavingsAccountRepository;

    public SavingsAccountRepositoryImpl(JpaSavingsAccountRepository jpaSavingsAccountRepository) {
        this.jpaSavingsAccountRepository = jpaSavingsAccountRepository;
    }

    @Override
    public Optional<SavingsAccount> findById(UUID id) {
        return jpaSavingsAccountRepository.findById(id);
    }

    @Override
    public List<SavingsAccount> findByUserId(UUID userId) {
        return jpaSavingsAccountRepository.findByUserId(userId);
    }

    @Override
    public SavingsAccount save(SavingsAccount savingsAccount) {
        return jpaSavingsAccountRepository.save(savingsAccount);
    }
}

