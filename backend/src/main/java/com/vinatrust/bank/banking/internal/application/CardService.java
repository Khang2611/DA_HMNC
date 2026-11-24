package com.vinatrust.bank.banking.internal.application;

import com.vinatrust.bank.banking.contracts.events.CardStatusChangedEvent;
import com.vinatrust.bank.banking.internal.api.dto.CardResponse;
import com.vinatrust.bank.banking.internal.api.dto.IssueCardRequest;
import com.vinatrust.bank.banking.internal.application.mapper.BankingMapper;
import com.vinatrust.bank.banking.internal.domain.Account;
import com.vinatrust.bank.banking.internal.domain.AccountRepository;
import com.vinatrust.bank.banking.internal.domain.Card;
import com.vinatrust.bank.banking.internal.domain.CardRepository;
import com.vinatrust.bank.banking.internal.domain.CardStatus;
import com.vinatrust.bank.banking.internal.domain.CardType;
import com.vinatrust.bank.shared.exception.BusinessRuleException;
import com.vinatrust.bank.shared.exception.ResourceNotFoundException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class CardService {

    private final CardRepository cardRepository;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;
    private final BankingMapper bankingMapper;
    private final SecureRandom random = new SecureRandom();

    public CardService(
            CardRepository cardRepository,
            AccountRepository accountRepository,
            PasswordEncoder passwordEncoder,
            ApplicationEventPublisher eventPublisher,
            BankingMapper bankingMapper
    ) {
        this.cardRepository = cardRepository;
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
        this.eventPublisher = eventPublisher;
        this.bankingMapper = bankingMapper;
    }

    @Transactional(readOnly = true)
    public List<CardResponse> getCardsByUserId(UUID userId) {
        return cardRepository.findByUserId(userId).stream()
                .map(bankingMapper::toCardResponse)
                .toList();
    }

    @Transactional
    public CardResponse issueCard(IssueCardRequest request, UUID userId) {
        Account account = accountRepository.findById(request.accountId())
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản liên kết không tồn tại"));

        if (!account.getUserId().equals(userId)) {
            throw new BusinessRuleException("Bạn không có quyền liên kết thẻ với tài khoản này");
        }

        CardType type = CardType.valueOf(request.cardType());
        int last4Int = 1000 + random.nextInt(9000);
        String last4 = String.valueOf(last4Int);
        String masked = (type == CardType.DEBIT ? "9704 03** **** " : "4111 22** **** ") + last4;

        String pinHash = request.pin() != null ? passwordEncoder.encode(request.pin()) : null;
        Instant expiry = Instant.now().plus(type == CardType.DEBIT ? 1825 : 1095, ChronoUnit.DAYS); // 5 năm hoặc 3 năm

        Card card = new Card(
                UUID.randomUUID(),
                userId,
                account.getId(),
                masked,
                last4,
                type,
                request.isVirtual(),
                type == CardType.CREDIT ? new BigDecimal("50000000.0000") : BigDecimal.ZERO,
                pinHash,
                CardStatus.ACTIVE,
                expiry
        );

        Card savedCard = cardRepository.save(card);
        return bankingMapper.toCardResponse(savedCard);
    }

    @Transactional
    public CardResponse lockCard(UUID cardId, UUID userId) {
        Card card = getCardAndVerifyOwner(cardId, userId);
        String oldStatus = card.getStatus().name();
        card.lock();
        Card updated = cardRepository.save(card);

        eventPublisher.publishEvent(new CardStatusChangedEvent(
                updated.getId(),
                updated.getUserId(),
                oldStatus,
                updated.getStatus().name(),
                "Khóa thẻ theo yêu cầu khách hàng",
                Instant.now()
        ));

        return bankingMapper.toCardResponse(updated);
    }

    @Transactional
    public CardResponse unlockCard(UUID cardId, UUID userId) {
        Card card = getCardAndVerifyOwner(cardId, userId);
        String oldStatus = card.getStatus().name();
        card.unlock();
        Card updated = cardRepository.save(card);

        eventPublisher.publishEvent(new CardStatusChangedEvent(
                updated.getId(),
                updated.getUserId(),
                oldStatus,
                updated.getStatus().name(),
                "Mở khóa thẻ theo yêu cầu khách hàng",
                Instant.now()
        ));

        return bankingMapper.toCardResponse(updated);
    }

    @Transactional
    public CardResponse reportLostCard(UUID cardId, UUID userId) {
        Card card = getCardAndVerifyOwner(cardId, userId);
        String oldStatus = card.getStatus().name();
        card.reportLost();
        Card updated = cardRepository.save(card);

        eventPublisher.publishEvent(new CardStatusChangedEvent(
                updated.getId(),
                updated.getUserId(),
                oldStatus,
                updated.getStatus().name(),
                "Báo mất thẻ khẩn cấp",
                Instant.now()
        ));

        return bankingMapper.toCardResponse(updated);
    }

    private Card getCardAndVerifyOwner(UUID cardId, UUID userId) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Thẻ không tồn tại"));

        if (!card.getUserId().equals(userId)) {
            throw new BusinessRuleException("Bạn không có quyền thao tác trên thẻ này");
        }
        return card;
    }
}

