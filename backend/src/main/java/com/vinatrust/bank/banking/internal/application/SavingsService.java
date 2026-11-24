package com.vinatrust.bank.banking.internal.application;

import com.vinatrust.bank.banking.internal.api.dto.OpenSavingsRequest;
import com.vinatrust.bank.banking.internal.api.dto.SavingsResponse;
import com.vinatrust.bank.banking.internal.application.mapper.BankingMapper;
import com.vinatrust.bank.banking.internal.domain.Account;
import com.vinatrust.bank.banking.internal.domain.AccountRepository;
import com.vinatrust.bank.banking.internal.domain.SavingsAccount;
import com.vinatrust.bank.banking.internal.domain.SavingsAccountRepository;
import com.vinatrust.bank.banking.internal.domain.SavingsStatus;
import com.vinatrust.bank.shared.exception.BusinessRuleException;
import com.vinatrust.bank.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class SavingsService {

    private final SavingsAccountRepository savingsAccountRepository;
    private final AccountRepository accountRepository;
    private final BankingMapper bankingMapper;

    public SavingsService(
            SavingsAccountRepository savingsAccountRepository,
            AccountRepository accountRepository,
            BankingMapper bankingMapper
    ) {
        this.savingsAccountRepository = savingsAccountRepository;
        this.accountRepository = accountRepository;
        this.bankingMapper = bankingMapper;
    }

    @Transactional(readOnly = true)
    public List<SavingsResponse> getSavingsByUserId(UUID userId) {
        return savingsAccountRepository.findByUserId(userId).stream()
                .map(bankingMapper::toSavingsResponse)
                .toList();
    }

    @Transactional
    public SavingsResponse openSavings(OpenSavingsRequest request, UUID userId) {
        if (request.principalAmount().compareTo(new BigDecimal("1000000.0000")) < 0) {
            throw new BusinessRuleException("Số tiền gửi tiết kiệm tối thiểu là 1.000.000 ₫");
        }

        Account sourceAccount = accountRepository.findByIdForUpdate(request.sourceAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản nguồn không tồn tại"));

        if (!sourceAccount.getUserId().equals(userId)) {
            throw new BusinessRuleException("Bạn không có quyền trích tiền từ tài khoản này");
        }

        // Trừ tiền tài khoản nguồn
        sourceAccount.debit(request.principalAmount());
        accountRepository.save(sourceAccount);

        BigDecimal rate = calculateInterestRate(request.termMonths());
        Instant maturityDate = Instant.now().plus(request.termMonths() * 30L, ChronoUnit.DAYS);

        SavingsAccount savings = new SavingsAccount(
                UUID.randomUUID(),
                userId,
                sourceAccount.getId(),
                request.principalAmount(),
                request.termMonths(),
                rate,
                SavingsStatus.ACTIVE,
                maturityDate
        );

        SavingsAccount saved = savingsAccountRepository.save(savings);
        return bankingMapper.toSavingsResponse(saved);
    }

    @Transactional
    public SavingsResponse settleSavings(UUID savingsId, UUID userId) {
        SavingsAccount savings = savingsAccountRepository.findById(savingsId)
                .orElseThrow(() -> new ResourceNotFoundException("Sổ tiết kiệm không tồn tại"));

        if (!savings.getUserId().equals(userId)) {
            throw new BusinessRuleException("Bạn không sở hữu sổ tiết kiệm này");
        }

        savings.settle();
        savingsAccountRepository.save(savings);

        // Hoàn gốc + lãi về tài khoản nguồn
        Account sourceAccount = accountRepository.findByIdForUpdate(savings.getSourceAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản nguồn nhận tiền không tồn tại"));

        BigDecimal interest = savings.getPrincipalAmount()
                .multiply(savings.getInterestRate())
                .multiply(BigDecimal.valueOf(savings.getTermMonths()))
                .divide(BigDecimal.valueOf(12), 4, RoundingMode.HALF_UP);

        BigDecimal totalPayout = savings.getPrincipalAmount().add(interest);
        sourceAccount.credit(totalPayout);
        accountRepository.save(sourceAccount);

        return bankingMapper.toSavingsResponse(savings);
    }

    private BigDecimal calculateInterestRate(int termMonths) {
        return switch (termMonths) {
            case 1 -> new BigDecimal("0.0300");  // 3.0%
            case 3 -> new BigDecimal("0.0350");  // 3.5%
            case 6 -> new BigDecimal("0.0500");  // 5.0%
            case 12 -> new BigDecimal("0.0580"); // 5.8%
            case 24 -> new BigDecimal("0.0620"); // 6.2%
            default -> new BigDecimal("0.0200"); // 2.0%
        };
    }
}

