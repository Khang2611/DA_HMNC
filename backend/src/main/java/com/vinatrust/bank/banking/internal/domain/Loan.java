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
@Table(name = "loans", schema = "banking")
public class Loan {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "loan_type", nullable = false, length = 50)
    private LoanType loanType;

    @Column(name = "requested_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal requestedAmount;

    @Column(name = "term_months", nullable = false)
    private int termMonths;

    @Column(name = "interest_rate", nullable = false, precision = 6, scale = 4)
    private BigDecimal interestRate;

    @Column(name = "collateral_value", precision = 19, scale = 4)
    private BigDecimal collateralValue;

    @Column(name = "monthly_income", nullable = false, precision = 19, scale = 4)
    private BigDecimal monthlyIncome;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private LoanStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Loan() {
    }

    public Loan(
            UUID id,
            UUID userId,
            LoanType loanType,
            BigDecimal requestedAmount,
            int termMonths,
            BigDecimal interestRate,
            BigDecimal collateralValue,
            BigDecimal monthlyIncome,
            LoanStatus status
    ) {
        this.id = id != null ? id : UUID.randomUUID();
        this.userId = Objects.requireNonNull(userId, "userId must not be null");
        this.loanType = loanType != null ? loanType : LoanType.UNSECURED;
        this.requestedAmount = Objects.requireNonNull(requestedAmount, "requestedAmount must not be null");
        this.termMonths = termMonths;
        this.interestRate = Objects.requireNonNull(interestRate, "interestRate must not be null");
        this.collateralValue = collateralValue != null ? collateralValue : BigDecimal.ZERO;
        this.monthlyIncome = Objects.requireNonNull(monthlyIncome, "monthlyIncome must not be null");
        this.status = status != null ? status : LoanStatus.PENDING;
        this.createdAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) this.id = UUID.randomUUID();
        if (this.createdAt == null) this.createdAt = Instant.now();
    }

    public void approve() {
        if (this.status != LoanStatus.PENDING) {
            throw new BusinessRuleException("Hồ sơ vay không trong trạng thái chờ duyệt (Hiện tại: " + this.status + ")");
        }
        this.status = LoanStatus.APPROVED;
    }

    public void reject() {
        if (this.status != LoanStatus.PENDING) {
            throw new BusinessRuleException("Hồ sơ vay không trong trạng thái chờ duyệt");
        }
        this.status = LoanStatus.REJECTED;
    }

    public void disburse() {
        if (this.status != LoanStatus.APPROVED) {
            throw new BusinessRuleException("Hồ sơ vay chưa được phê duyệt, không thể giải ngân");
        }
        this.status = LoanStatus.DISBURSED;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public LoanType getLoanType() { return loanType; }
    public BigDecimal getRequestedAmount() { return requestedAmount; }
    public int getTermMonths() { return termMonths; }
    public BigDecimal getInterestRate() { return interestRate; }
    public BigDecimal getCollateralValue() { return collateralValue; }
    public BigDecimal getMonthlyIncome() { return monthlyIncome; }
    public LoanStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
}

