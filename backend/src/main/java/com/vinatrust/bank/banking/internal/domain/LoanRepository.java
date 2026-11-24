package com.vinatrust.bank.banking.internal.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LoanRepository {

    Optional<Loan> findById(UUID id);

    List<Loan> findByUserId(UUID userId);

    Loan save(Loan loan);
}

