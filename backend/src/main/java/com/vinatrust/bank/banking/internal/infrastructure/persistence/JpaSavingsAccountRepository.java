package com.vinatrust.bank.banking.internal.infrastructure.persistence;

import com.vinatrust.bank.banking.internal.domain.SavingsAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface JpaSavingsAccountRepository extends JpaRepository<SavingsAccount, UUID> {

    List<SavingsAccount> findByUserId(UUID userId);
}

