package com.vinatrust.bank.banking.internal.infrastructure.persistence;

import com.vinatrust.bank.banking.internal.domain.Loan;
import com.vinatrust.bank.banking.internal.domain.LoanRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class LoanRepositoryImpl implements LoanRepository {

    private final JpaLoanRepository jpaLoanRepository;

    public LoanRepositoryImpl(JpaLoanRepository jpaLoanRepository) {
        this.jpaLoanRepository = jpaLoanRepository;
    }

    @Override
    public Optional<Loan> findById(UUID id) {
        return jpaLoanRepository.findById(id);
    }

    @Override
    public List<Loan> findByUserId(UUID userId) {
        return jpaLoanRepository.findByUserId(userId);
    }

    @Override
    public Loan save(Loan loan) {
        return jpaLoanRepository.save(loan);
    }
}

