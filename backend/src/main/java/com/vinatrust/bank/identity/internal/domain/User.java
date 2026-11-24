package com.vinatrust.bank.identity.internal.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "users", schema = "identity")
public class User {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "phone", nullable = false, unique = true, length = 20)
    private String phone;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "date_of_birth", length = 20)
    private String dateOfBirth;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "transaction_pin_hash", length = 255)
    private String transactionPinHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 30)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private UserStatus status;

    @Column(name = "kyc_status", nullable = false, length = 30)
    private String kycStatus;

    @Column(name = "kyc_biometric_verified", nullable = false)
    private boolean kycBiometricVerified = false;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    @Column(name = "customer_tier", length = 50)
    private String customerTier;

    @Column(name = "assigned_team", length = 100)
    private String assignedTeam;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected User() {
        // JPA required constructor
    }

    public User(
            UUID id,
            String username,
            String email,
            String phone,
            String fullName,
            String dateOfBirth,
            String passwordHash,
            String transactionPinHash,
            Role role,
            UserStatus status,
            String kycStatus,
            String customerTier
    ) {
        this(id, username, email, phone, fullName, dateOfBirth, passwordHash, transactionPinHash,
                role, status, kycStatus, false, customerTier, null);
    }

    public User(
            UUID id,
            String username,
            String email,
            String phone,
            String fullName,
            String dateOfBirth,
            String passwordHash,
            String transactionPinHash,
            Role role,
            UserStatus status,
            String kycStatus,
            boolean kycBiometricVerified,
            String customerTier,
            String assignedTeam
    ) {
        this(id, username, email, phone, fullName, dateOfBirth, passwordHash, transactionPinHash,
                role, status, kycStatus, kycBiometricVerified, false, customerTier, assignedTeam);
    }

    public User(
            UUID id,
            String username,
            String email,
            String phone,
            String fullName,
            String dateOfBirth,
            String passwordHash,
            String transactionPinHash,
            Role role,
            UserStatus status,
            String kycStatus,
            boolean kycBiometricVerified,
            boolean emailVerified,
            String customerTier,
            String assignedTeam
    ) {
        this.id = id != null ? id : UUID.randomUUID();
        this.username = Objects.requireNonNull(username, "Username must not be null");
        this.email = Objects.requireNonNull(email, "Email must not be null");
        this.phone = Objects.requireNonNull(phone, "Phone must not be null");
        this.fullName = Objects.requireNonNull(fullName, "Full name must not be null");
        this.dateOfBirth = dateOfBirth;
        this.passwordHash = Objects.requireNonNull(passwordHash, "Password hash must not be null");
        this.transactionPinHash = transactionPinHash;
        this.role = role != null ? role : Role.CUSTOMER;
        this.status = status != null ? status : UserStatus.ACTIVE;
        this.kycStatus = kycStatus != null ? kycStatus : "UNVERIFIED";
        this.kycBiometricVerified = kycBiometricVerified;
        this.emailVerified = emailVerified;
        this.customerTier = customerTier;
        this.assignedTeam = assignedTeam;
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // Business Methods
    public void lock() {
        this.status = UserStatus.LOCKED;
    }

    public void activate() {
        this.status = UserStatus.ACTIVE;
    }

    public void verifyEmail() {
        this.emailVerified = true;
        this.status = UserStatus.ACTIVE;
    }

    public void updatePassword(String newPasswordHash) {
        this.passwordHash = Objects.requireNonNull(newPasswordHash);
    }

    public void updatePin(String newPinHash) {
        this.transactionPinHash = newPinHash;
    }

    public void updateProfile(String fullName, String email, String phone, String dateOfBirth) {
        if (fullName != null && !fullName.isBlank()) this.fullName = fullName;
        if (email != null && !email.isBlank()) this.email = email;
        if (phone != null && !phone.isBlank()) this.phone = phone;
        if (dateOfBirth != null && !dateOfBirth.isBlank()) this.dateOfBirth = dateOfBirth;
    }

    public void changeRole(Role newRole, String assignedTeam, String customerTier) {
        this.role = Objects.requireNonNull(newRole, "New role must not be null");
        this.assignedTeam = assignedTeam;
        this.customerTier = customerTier;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getFullName() { return fullName; }
    public String getDateOfBirth() { return dateOfBirth; }
    public String getPasswordHash() { return passwordHash; }
    public String getTransactionPinHash() { return transactionPinHash; }
    public Role getRole() { return role; }
    public UserStatus getStatus() { return status; }
    public String getKycStatus() { return kycStatus; }
    public boolean isKycBiometricVerified() { return kycBiometricVerified; }
    public void setKycBiometricVerified(boolean kycBiometricVerified) { this.kycBiometricVerified = kycBiometricVerified; }
    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }
    public String getCustomerTier() { return customerTier; }
    public String getAssignedTeam() { return assignedTeam; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
