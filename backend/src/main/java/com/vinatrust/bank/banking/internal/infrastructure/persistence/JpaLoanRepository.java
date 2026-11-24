package com.vinatrust.bank.banking.internal.infrastructure.persistence;

import com.vinatrust.bank.banking.internal.domain.Loan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface JpaLoanRepository extends JpaRepository<Loan, UUID> {

    List<Loan> findByUserId(UUID userId);
}

