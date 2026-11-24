package com.vinatrust.bank.banking.internal.domain;

import com.vinatrust.bank.shared.exception.BusinessRuleException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "accounts", schema = "banking")
public class Account {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "account_number", nullable = false, unique = true, length = 20)
    private String accountNumber;

    @Column(name = "balance", nullable = false, precision = 19, scale = 4)
    private BigDecimal balance;

    @Column(name = "daily_limit", nullable = false, precision = 19, scale = 4)
    private BigDecimal dailyLimit;

    @Column(name = "currency", nullable = false, length = 10)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private AccountStatus status;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Account() {
        // JPA required
    }

    public Account(
            UUID id,
            UUID userId,
            String accountNumber,
            BigDecimal balance,
            BigDecimal dailyLimit,
            String currency,
            AccountStatus status
    ) {
        this.id = id != null ? id : UUID.randomUUID();
        this.userId = Objects.requireNonNull(userId, "userId must not be null");
        this.accountNumber = Objects.requireNonNull(accountNumber, "accountNumber must not be null");
        this.balance = balance != null ? balance : BigDecimal.ZERO;
        this.dailyLimit = dailyLimit != null ? dailyLimit : new BigDecimal("50000000.0000");
        this.currency = currency != null ? currency : "VND";
        this.status = status != null ? status : AccountStatus.ACTIVE;
        this.version = 0L;
        this.createdAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) this.id = UUID.randomUUID();
        if (this.createdAt == null) this.createdAt = Instant.now();
        if (this.balance == null) this.balance = BigDecimal.ZERO;
        if (this.dailyLimit == null) this.dailyLimit = new BigDecimal("50000000.0000");
        if (this.currency == null) this.currency = "VND";
        if (this.status == null) this.status = AccountStatus.ACTIVE;
    }

    public void credit(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Số tiền nạp vào tài khoản phải lớn hơn 0");
        }
        if (this.status == AccountStatus.CLOSED || this.status == AccountStatus.FROZEN) {
            throw new BusinessRuleException("Tài khoản đang trong trạng thái " + this.status + ", không thể nhận tiền");
        }
        this.balance = this.balance.add(amount);
    }

    public void debit(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Số tiền trích xuất phải lớn hơn 0");
        }
        if (this.status != AccountStatus.ACTIVE) {
            throw new BusinessRuleException("Tài khoản đang không hoạt động (Trạng thái: " + this.status + ")");
        }
        if (this.balance.compareTo(amount) < 0) {
            throw new BusinessRuleException("Số dư tài khoản không đủ để thực hiện giao dịch");
        }
        this.balance = this.balance.subtract(amount);
    }

    public void freeze(String reason) {
        this.status = AccountStatus.FROZEN;
    }

    public void unfreeze() {
        this.status = AccountStatus.ACTIVE;
    }

    public void lock() {
        this.status = AccountStatus.LOCKED;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getAccountNumber() { return accountNumber; }
    public BigDecimal getBalance() { return balance; }
    public BigDecimal getDailyLimit() { return dailyLimit; }
    public String getCurrency() { return currency; }
    public AccountStatus getStatus() { return status; }
    public Long getVersion() { return version; }
    public Instant getCreatedAt() { return createdAt; }
}

