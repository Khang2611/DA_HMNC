package com.vinatrust.bank.banking.internal.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AccountRepository {

    Optional<Account> findById(UUID id);

    Optional<Account> findByIdForUpdate(UUID id);

    Optional<Account> findByAccountNumber(String accountNumber);

    Optional<Account> findByAccountNumberForUpdate(String accountNumber);

    List<Account> findByUserId(UUID userId);

    boolean existsByAccountNumber(String accountNumber);

    Account save(Account account);
}

