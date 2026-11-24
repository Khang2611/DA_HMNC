package com.vinatrust.bank.banking.internal.infrastructure.seed;

import com.vinatrust.bank.banking.internal.domain.Account;
import com.vinatrust.bank.banking.internal.domain.AccountRepository;
import com.vinatrust.bank.banking.internal.domain.AccountStatus;
import com.vinatrust.bank.banking.internal.domain.AuthMethod;
import com.vinatrust.bank.banking.internal.domain.Card;
import com.vinatrust.bank.banking.internal.domain.CardRepository;
import com.vinatrust.bank.banking.internal.domain.CardStatus;
import com.vinatrust.bank.banking.internal.domain.CardType;
import com.vinatrust.bank.banking.internal.domain.SavingsAccount;
import com.vinatrust.bank.banking.internal.domain.SavingsAccountRepository;
import com.vinatrust.bank.banking.internal.domain.SavingsStatus;
import com.vinatrust.bank.banking.internal.domain.Transaction;
import com.vinatrust.bank.banking.internal.domain.TransactionChannel;
import com.vinatrust.bank.banking.internal.domain.TransactionRepository;
import com.vinatrust.bank.banking.internal.domain.TransactionStatus;
import com.vinatrust.bank.identity.contracts.IdentityQueryContract;
import com.vinatrust.bank.identity.contracts.dto.UserSummaryDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Component
@Order(2)
public class BankingDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(BankingDataSeeder.class);

    private final IdentityQueryContract identityQueryContract;
    private final AccountRepository accountRepository;
    private final CardRepository cardRepository;
    private final SavingsAccountRepository savingsAccountRepository;
    private final TransactionRepository transactionRepository;

    public BankingDataSeeder(
            IdentityQueryContract identityQueryContract,
            AccountRepository accountRepository,
            CardRepository cardRepository,
            SavingsAccountRepository savingsAccountRepository,
            TransactionRepository transactionRepository
    ) {
        this.identityQueryContract = identityQueryContract;
        this.accountRepository = accountRepository;
        this.cardRepository = cardRepository;
        this.savingsAccountRepository = savingsAccountRepository;
        this.transactionRepository = transactionRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        Optional<UserSummaryDto> customerOpt = identityQueryContract.findUserByUsername("customer1");
        if (customerOpt.isEmpty()) {
            log.warn("Customer1 not found in Identity module. Skipping banking data seeding.");
            return;
        }

        UserSummaryDto customer = customerOpt.get();
        if (!accountRepository.findByUserId(customer.id()).isEmpty()) {
            log.info("Banking data already seeded for user '{}'. Skipping.", customer.username());
            return;
        }

        log.info("Seeding banking portfolio for user '{}'...", customer.username());

        // 1. Primary Payment Account (50,000,000 VND)
        Account checkingAccount = new Account(
                UUID.randomUUID(),
                customer.id(),
                "1029384756",
                new BigDecimal("50000000.0000"),
                new BigDecimal("100000000.0000"), // 100M daily limit
                "VND",
                AccountStatus.ACTIVE
        );
        Account savedAccount = accountRepository.save(checkingAccount);

        // 2. Physical Debit Card (Napas 247)
        Card debitCard = new Card(
                UUID.randomUUID(),
                customer.id(),
                savedAccount.getId(),
                "9704 03** **** 8829",
                "8829",
                CardType.DEBIT,
                false,
                BigDecimal.ZERO,
                null,
                CardStatus.ACTIVE,
                Instant.now().plus(1825, ChronoUnit.DAYS)
        );
        cardRepository.save(debitCard);

        // 3. Virtual Credit Card (Visa Platinum / Infinite)
        Card creditCard = new Card(
                UUID.randomUUID(),
                customer.id(),
                savedAccount.getId(),
                "4111 22** **** 1042",
                "1042",
                CardType.CREDIT,
                true,
                new BigDecimal("100000000.0000"), // 100M credit limit
                null,
                CardStatus.ACTIVE,
                Instant.now().plus(1095, ChronoUnit.DAYS)
        );
        cardRepository.save(creditCard);

        // 4. Term Savings Account (100,000,000 VND, 6 months, 5.0% annual rate)
        SavingsAccount savings = new SavingsAccount(
                UUID.randomUUID(),
                customer.id(),
                savedAccount.getId(),
                new BigDecimal("100000000.0000"),
                6,
                new BigDecimal("0.0500"),
                SavingsStatus.ACTIVE,
                Instant.now().plus(180, ChronoUnit.DAYS)
        );
        savingsAccountRepository.save(savings);

        // 5. Initial Sample Transaction
        Transaction tx = new Transaction(
                UUID.randomUUID(),
                "TRF" + System.currentTimeMillis(),
                savedAccount.getId(),
                "0987654321",
                "VCB",
                new BigDecimal("2500000.0000"),
                BigDecimal.ZERO,
                TransactionChannel.NAPAS_247,
                AuthMethod.PIN,
                "Chuyen tien thanh toan hoa don dich vu",
                TransactionStatus.SUCCESS
        );
        transactionRepository.save(tx);

        log.info("Banking data successfully seeded for customer1 (Account, Cards, Savings, Transaction).");
    }
}

