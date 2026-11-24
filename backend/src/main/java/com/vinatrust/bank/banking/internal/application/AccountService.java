package com.vinatrust.bank.banking.internal.application;

import com.vinatrust.bank.banking.internal.api.dto.AccountResponse;
import com.vinatrust.bank.banking.internal.application.mapper.BankingMapper;
import com.vinatrust.bank.banking.internal.domain.Account;
import com.vinatrust.bank.banking.internal.domain.AccountRepository;
import com.vinatrust.bank.banking.internal.domain.AccountStatus;
import com.vinatrust.bank.shared.exception.BusinessRuleException;
import com.vinatrust.bank.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.List;
import java.util.UUID;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final BankingMapper bankingMapper;
    private final SecureRandom random = new SecureRandom();

    public AccountService(AccountRepository accountRepository, BankingMapper bankingMapper) {
        this.accountRepository = accountRepository;
        this.bankingMapper = bankingMapper;
    }

    @Transactional(readOnly = true)
    public List<AccountResponse> getAccountsByUserId(UUID userId) {
        return accountRepository.findByUserId(userId).stream()
                .map(bankingMapper::toAccountResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AccountResponse getAccountById(UUID accountId, UUID userId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại"));

        if (!account.getUserId().equals(userId)) {
            throw new BusinessRuleException("Bạn không có quyền truy cập tài khoản này");
        }

        return bankingMapper.toAccountResponse(account);
    }

    @Transactional
    public Account createDefaultAccount(UUID userId) {
        String accountNumber;
        do {
            long randNum = 1000000000L + (long) (random.nextDouble() * 9000000000L);
            accountNumber = String.valueOf(randNum);
        } while (accountRepository.existsByAccountNumber(accountNumber));

        Account account = new Account(
                UUID.randomUUID(),
                userId,
                accountNumber,
                BigDecimal.ZERO,
                new BigDecimal("50000000.0000"), // Hạn mức 50 triệu/ngày
                "VND",
                AccountStatus.ACTIVE
        );

        return accountRepository.save(account);
    }
}

