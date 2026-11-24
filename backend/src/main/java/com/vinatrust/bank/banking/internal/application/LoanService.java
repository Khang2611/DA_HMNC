package com.vinatrust.bank.banking.internal.application;

import com.vinatrust.bank.banking.internal.api.dto.LoanApplicationRequest;
import com.vinatrust.bank.banking.internal.api.dto.LoanResponse;
import com.vinatrust.bank.banking.internal.application.mapper.BankingMapper;
import com.vinatrust.bank.banking.internal.domain.Loan;
import com.vinatrust.bank.banking.internal.domain.LoanRepository;
import com.vinatrust.bank.banking.internal.domain.LoanStatus;
import com.vinatrust.bank.banking.internal.domain.LoanType;
import com.vinatrust.bank.shared.exception.BusinessRuleException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class LoanService {

    private final LoanRepository loanRepository;
    private final BankingMapper bankingMapper;

    public LoanService(LoanRepository loanRepository, BankingMapper bankingMapper) {
        this.loanRepository = loanRepository;
        this.bankingMapper = bankingMapper;
    }

    @Transactional(readOnly = true)
    public List<LoanResponse> getLoansByUserId(UUID userId) {
        return loanRepository.findByUserId(userId).stream()
                .map(bankingMapper::toLoanResponse)
                .toList();
    }

    @Transactional
    public LoanResponse applyLoan(LoanApplicationRequest request, UUID userId) {
        if (request.monthlyIncome().compareTo(new BigDecimal("5000000.0000")) < 0) {
            throw new BusinessRuleException("Thu nhập hàng tháng tối thiểu để đăng ký khoản vay là 5.000.000 ₫");
        }

        LoanType type = LoanType.valueOf(request.loanType());
        BigDecimal rate = switch (type) {
            case CONSUMER -> new BigDecimal("0.1200"); // 12%
            case AUTO -> new BigDecimal("0.0850");     // 8.5%
            case MORTGAGE -> new BigDecimal("0.0750"); // 7.5%
            case UNSECURED -> new BigDecimal("0.1500");// 15%
        };

        Loan loan = new Loan(
                UUID.randomUUID(),
                userId,
                type,
                request.requestedAmount(),
                request.termMonths(),
                rate,
                request.collateralValue(),
                request.monthlyIncome(),
                LoanStatus.PENDING
        );

        Loan saved = loanRepository.save(loan);
        return bankingMapper.toLoanResponse(saved);
    }
}

