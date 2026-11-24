package com.vinatrust.bank.banking.internal.application;

import com.vinatrust.bank.banking.contracts.BankingSupportContract;
import com.vinatrust.bank.banking.contracts.dto.AccountOverviewDto;
import com.vinatrust.bank.banking.contracts.events.CardStatusChangedEvent;
import com.vinatrust.bank.banking.internal.application.mapper.BankingMapper;
import com.vinatrust.bank.banking.internal.domain.Account;
import com.vinatrust.bank.banking.internal.domain.AccountRepository;
import com.vinatrust.bank.banking.internal.domain.Card;
import com.vinatrust.bank.banking.internal.domain.CardRepository;
import com.vinatrust.bank.shared.exception.ResourceNotFoundException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class BankingSupportContractImpl implements BankingSupportContract {

    private final AccountRepository accountRepository;
    private final CardRepository cardRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final BankingMapper bankingMapper;

    public BankingSupportContractImpl(
            AccountRepository accountRepository,
            CardRepository cardRepository,
            ApplicationEventPublisher eventPublisher,
            BankingMapper bankingMapper
    ) {
        this.accountRepository = accountRepository;
        this.cardRepository = cardRepository;
        this.eventPublisher = eventPublisher;
        this.bankingMapper = bankingMapper;
    }

    @Override
    @Transactional
    public void freezeAccount(UUID accountId, String reason) {
        Account account = accountRepository.findByIdForUpdate(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại"));
        account.freeze(reason);
        accountRepository.save(account);
    }

    @Override
    @Transactional
    public void unfreezeAccount(UUID accountId, String reason) {
        Account account = accountRepository.findByIdForUpdate(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại"));
        account.unfreeze();
        accountRepository.save(account);
    }

    @Override
    @Transactional
    public void permanentlyLockCard(UUID cardId, String reason) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Thẻ không tồn tại"));
        String oldStatus = card.getStatus().name();
        card.reportLost();
        cardRepository.save(card);

        eventPublisher.publishEvent(new CardStatusChangedEvent(
                card.getId(),
                card.getUserId(),
                oldStatus,
                card.getStatus().name(),
                reason,
                Instant.now()
        ));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<AccountOverviewDto> getAccountOverview(UUID accountId) {
        return accountRepository.findById(accountId)
                .map(bankingMapper::toAccountOverviewDto);
    }
}

