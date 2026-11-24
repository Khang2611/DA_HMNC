package com.vinatrust.bank.banking.internal.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SavingsAccountRepository {

    Optional<SavingsAccount> findById(UUID id);

    List<SavingsAccount> findByUserId(UUID userId);

    SavingsAccount save(SavingsAccount savingsAccount);
}

