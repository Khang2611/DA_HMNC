package com.vinatrust.bank.identity.internal.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "email_verification_tokens", schema = "identity")
public class EmailVerificationToken {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "otp_hash", nullable = false, length = 64)
    private String otpHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount = 0;

    @Column(name = "used", nullable = false)
    private boolean used = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected EmailVerificationToken() {
        // JPA required constructor
    }

    public EmailVerificationToken(UUID userId, String otpHash, Instant expiresAt) {
        this.id = UUID.randomUUID();
        this.userId = Objects.requireNonNull(userId, "UserId must not be null");
        this.otpHash = Objects.requireNonNull(otpHash, "OtpHash must not be null");
        this.expiresAt = Objects.requireNonNull(expiresAt, "ExpiresAt must not be null");
        this.attemptCount = 0;
        this.used = false;
        this.createdAt = Instant.now();
    }

    public EmailVerificationToken(UUID id, UUID userId, String otpHash, Instant expiresAt, int attemptCount, boolean used, Instant createdAt) {
        this.id = id != null ? id : UUID.randomUUID();
        this.userId = Objects.requireNonNull(userId, "UserId must not be null");
        this.otpHash = Objects.requireNonNull(otpHash, "OtpHash must not be null");
        this.expiresAt = Objects.requireNonNull(expiresAt, "ExpiresAt must not be null");
        this.attemptCount = attemptCount;
        this.used = used;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    // Business Methods
    public void incrementAttempt() {
        this.attemptCount++;
    }

    public void markUsed() {
        this.used = true;
    }

    public boolean isExpired(Instant now) {
        return expiresAt.isBefore(now);
    }

    public boolean isMaxAttemptsReached(int maxAttempts) {
        return this.attemptCount >= maxAttempts;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getOtpHash() { return otpHash; }
    public Instant getExpiresAt() { return expiresAt; }
    public int getAttemptCount() { return attemptCount; }
    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }
    public Instant getCreatedAt() { return createdAt; }
}

