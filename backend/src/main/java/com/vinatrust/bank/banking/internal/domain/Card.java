package com.vinatrust.bank.banking.internal.domain;

import com.vinatrust.bank.shared.exception.BusinessRuleException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "cards", schema = "banking")
public class Card {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(name = "card_number_masked", nullable = false, length = 30)
    private String cardNumberMasked;

    @Column(name = "card_last4", nullable = false, length = 4)
    private String cardLast4;

    @Enumerated(EnumType.STRING)
    @Column(name = "card_type", nullable = false, length = 30)
    private CardType cardType;

    @Column(name = "is_virtual", nullable = false)
    private boolean isVirtual;

    @Column(name = "credit_limit", precision = 19, scale = 4)
    private BigDecimal creditLimit;

    @Column(name = "pin_hash", length = 255)
    private String pinHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private CardStatus status;

    @Column(name = "expired_at", nullable = false)
    private Instant expiredAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Card() {
    }

    public Card(
            UUID id,
            UUID userId,
            UUID accountId,
            String cardNumberMasked,
            String cardLast4,
            CardType cardType,
            boolean isVirtual,
            BigDecimal creditLimit,
            String pinHash,
            CardStatus status,
            Instant expiredAt
    ) {
        this.id = id != null ? id : UUID.randomUUID();
        this.userId = Objects.requireNonNull(userId, "userId must not be null");
        this.accountId = Objects.requireNonNull(accountId, "accountId must not be null");
        this.cardNumberMasked = Objects.requireNonNull(cardNumberMasked, "cardNumberMasked must not be null");
        this.cardLast4 = Objects.requireNonNull(cardLast4, "cardLast4 must not be null");
        this.cardType = cardType != null ? cardType : CardType.DEBIT;
        this.isVirtual = isVirtual;
        this.creditLimit = creditLimit != null ? creditLimit : BigDecimal.ZERO;
        this.pinHash = pinHash;
        this.status = status != null ? status : CardStatus.ACTIVE;
        this.expiredAt = Objects.requireNonNull(expiredAt, "expiredAt must not be null");
        this.createdAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) this.id = UUID.randomUUID();
        if (this.createdAt == null) this.createdAt = Instant.now();
    }

    public void lock() {
        if (this.status == CardStatus.LOST) {
            throw new BusinessRuleException("Thẻ đã báo mất vĩnh viễn, không thể thao tác");
        }
        this.status = CardStatus.LOCKED;
    }

    public void unlock() {
        if (this.status == CardStatus.LOST) {
            throw new BusinessRuleException("Thẻ đã báo mất vĩnh viễn, không thể mở khóa");
        }
        this.status = CardStatus.ACTIVE;
    }

    public void reportLost() {
        this.status = CardStatus.LOST;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public UUID getAccountId() { return accountId; }
    public String getCardNumberMasked() { return cardNumberMasked; }
    public String getCardLast4() { return cardLast4; }
    public CardType getCardType() { return cardType; }
    public boolean isVirtual() { return isVirtual; }
    public BigDecimal getCreditLimit() { return creditLimit; }
    public String getPinHash() { return pinHash; }
    public CardStatus getStatus() { return status; }
    public Instant getExpiredAt() { return expiredAt; }
    public Instant getCreatedAt() { return createdAt; }
}

