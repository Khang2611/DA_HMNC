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
@Table(name = "savings_accounts", schema = "banking")
public class SavingsAccount {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "source_account_id", nullable = false)
    private UUID sourceAccountId;

    @Column(name = "principal_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal principalAmount;

    @Column(name = "term_months", nullable = false)
    private int termMonths;

    @Column(name = "interest_rate", nullable = false, precision = 6, scale = 4)
    private BigDecimal interestRate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private SavingsStatus status;

    @Column(name = "opened_at", nullable = false, updatable = false)
    private Instant openedAt;

    @Column(name = "maturity_date", nullable = false)
    private Instant maturityDate;

    protected SavingsAccount() {
    }

    public SavingsAccount(
            UUID id,
            UUID userId,
            UUID sourceAccountId,
            BigDecimal principalAmount,
            int termMonths,
            BigDecimal interestRate,
            SavingsStatus status,
            Instant maturityDate
    ) {
        this.id = id != null ? id : UUID.randomUUID();
        this.userId = Objects.requireNonNull(userId, "userId must not be null");
        this.sourceAccountId = Objects.requireNonNull(sourceAccountId, "sourceAccountId must not be null");
        this.principalAmount = Objects.requireNonNull(principalAmount, "principalAmount must not be null");
        this.termMonths = termMonths;
        this.interestRate = Objects.requireNonNull(interestRate, "interestRate must not be null");
        this.status = status != null ? status : SavingsStatus.ACTIVE;
        this.openedAt = Instant.now();
        this.maturityDate = Objects.requireNonNull(maturityDate, "maturityDate must not be null");
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) this.id = UUID.randomUUID();
        if (this.openedAt == null) this.openedAt = Instant.now();
    }

    public void settle() {
        if (this.status == SavingsStatus.SETTLED) {
            throw new BusinessRuleException("Sổ tiết kiệm đã được tất toán trước đó");
        }
        this.status = SavingsStatus.SETTLED;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public UUID getSourceAccountId() { return sourceAccountId; }
    public BigDecimal getPrincipalAmount() { return principalAmount; }
    public int getTermMonths() { return termMonths; }
    public BigDecimal getInterestRate() { return interestRate; }
    public SavingsStatus getStatus() { return status; }
    public Instant getOpenedAt() { return openedAt; }
    public Instant getMaturityDate() { return maturityDate; }
}

