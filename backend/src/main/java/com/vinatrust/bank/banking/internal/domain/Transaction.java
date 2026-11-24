package com.vinatrust.bank.banking.internal.domain;

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
@Table(name = "transactions", schema = "banking")
public class Transaction {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "reference_code", nullable = false, unique = true, length = 50)
    private String referenceCode;

    @Column(name = "from_account_id")
    private UUID fromAccountId;

    @Column(name = "to_account_number", nullable = false, length = 50)
    private String toAccountNumber;

    @Column(name = "to_bank_code", nullable = false, length = 20)
    private String toBankCode;

    @Column(name = "amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(name = "fee", nullable = false, precision = 19, scale = 4)
    private BigDecimal fee;

    @Enumerated(EnumType.STRING)
    @Column(name = "transfer_channel", nullable = false, length = 30)
    private TransactionChannel transferChannel;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_method", nullable = false, length = 30)
    private AuthMethod authMethod;

    @Column(name = "description", length = 255)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private TransactionStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Transaction() {
    }

    public Transaction(
            UUID id,
            String referenceCode,
            UUID fromAccountId,
            String toAccountNumber,
            String toBankCode,
            BigDecimal amount,
            BigDecimal fee,
            TransactionChannel transferChannel,
            AuthMethod authMethod,
            String description,
            TransactionStatus status
    ) {
        this.id = id != null ? id : UUID.randomUUID();
        this.referenceCode = Objects.requireNonNull(referenceCode, "referenceCode must not be null");
        this.fromAccountId = fromAccountId;
        this.toAccountNumber = Objects.requireNonNull(toAccountNumber, "toAccountNumber must not be null");
        this.toBankCode = Objects.requireNonNull(toBankCode, "toBankCode must not be null");
        this.amount = Objects.requireNonNull(amount, "amount must not be null");
        this.fee = fee != null ? fee : BigDecimal.ZERO;
        this.transferChannel = transferChannel != null ? transferChannel : TransactionChannel.INTERNAL;
        this.authMethod = authMethod != null ? authMethod : AuthMethod.NONE;
        this.description = description;
        this.status = status != null ? status : TransactionStatus.SUCCESS;
        this.createdAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) this.id = UUID.randomUUID();
        if (this.createdAt == null) this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public String getReferenceCode() { return referenceCode; }
    public UUID getFromAccountId() { return fromAccountId; }
    public String getToAccountNumber() { return toAccountNumber; }
    public String getToBankCode() { return toBankCode; }
    public BigDecimal getAmount() { return amount; }
    public BigDecimal getFee() { return fee; }
    public TransactionChannel getTransferChannel() { return transferChannel; }
    public AuthMethod getAuthMethod() { return authMethod; }
    public String getDescription() { return description; }
    public TransactionStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
}

