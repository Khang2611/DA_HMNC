package com.vinatrust.bank.banking.internal.application;

import com.vinatrust.bank.banking.contracts.events.TransactionCompletedEvent;
import com.vinatrust.bank.banking.internal.api.dto.TransferRequest;
import com.vinatrust.bank.banking.internal.api.dto.TransferResponse;
import com.vinatrust.bank.banking.internal.application.mapper.BankingMapper;
import com.vinatrust.bank.banking.internal.domain.Account;
import com.vinatrust.bank.banking.internal.domain.AccountRepository;
import com.vinatrust.bank.banking.internal.domain.AuthMethod;
import com.vinatrust.bank.banking.internal.domain.BiometricLimitPolicy;
import com.vinatrust.bank.banking.internal.domain.FeePolicy;
import com.vinatrust.bank.banking.internal.domain.Transaction;
import com.vinatrust.bank.banking.internal.domain.TransactionChannel;
import com.vinatrust.bank.banking.internal.domain.TransactionRepository;
import com.vinatrust.bank.banking.internal.domain.TransactionStatus;
import com.vinatrust.bank.identity.contracts.IdentityQueryContract;
import com.vinatrust.bank.identity.contracts.dto.UserSummaryDto;
import com.vinatrust.bank.shared.exception.BusinessRuleException;
import com.vinatrust.bank.shared.exception.ResourceNotFoundException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class TransferService {

    public static final String VINATRUST_BANK_CODE = "VINATRUST";
    public static final String VINATRUST_BIN = "970403";

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final IdentityQueryContract identityQueryContract;
    private final BiometricLimitPolicy biometricLimitPolicy;
    private final FeePolicy feePolicy;
    private final ApplicationEventPublisher eventPublisher;
    private final BankingMapper bankingMapper;
    private final SecureRandom random = new SecureRandom();

    public TransferService(
            AccountRepository accountRepository,
            TransactionRepository transactionRepository,
            IdentityQueryContract identityQueryContract,
            BiometricLimitPolicy biometricLimitPolicy,
            FeePolicy feePolicy,
            ApplicationEventPublisher eventPublisher,
            BankingMapper bankingMapper
    ) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.identityQueryContract = identityQueryContract;
        this.biometricLimitPolicy = biometricLimitPolicy;
        this.feePolicy = feePolicy;
        this.eventPublisher = eventPublisher;
        this.bankingMapper = bankingMapper;
    }

    @Transactional
    public TransferResponse transfer(TransferRequest request, UUID userId) {
        // 1. Fetch user info from Identity module contract
        UserSummaryDto userSummary = identityQueryContract.findUserById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        // 2. Fetch source account with Pessimistic Write Lock
        Account sourceAccount = accountRepository.findByIdForUpdate(request.fromAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản nguồn không tồn tại"));

        if (!sourceAccount.getUserId().equals(userId)) {
            throw new BusinessRuleException("Bạn không phải chủ sở hữu của tài khoản nguồn");
        }

        TransactionChannel channel = TransactionChannel.valueOf(request.transferChannel());
        AuthMethod authMethod = TransactionChannel.INTERNAL == channel && request.authMethod() == null
                ? AuthMethod.NONE
                : AuthMethod.valueOf(request.authMethod() != null ? request.authMethod() : "PIN");

        // 3. Enforce State Bank of Vietnam Biometric & Daily Limit Policy
        biometricLimitPolicy.validateTransfer(
                request.amount(),
                sourceAccount,
                userSummary.kycBiometricVerified(),
                authMethod
        );

        // 4. Calculate Fee
        BigDecimal fee = feePolicy.calculateFee(channel, userSummary.customerTier());
        BigDecimal totalDeduction = request.amount().add(fee);

        // 5. Debit source account balance
        sourceAccount.debit(totalDeduction);
        accountRepository.save(sourceAccount);

        // 6. If Internal Transfer, credit destination account with Pessimistic Write Lock
        boolean isInternal = VINATRUST_BANK_CODE.equalsIgnoreCase(request.toBankCode()) ||
                VINATRUST_BIN.equalsIgnoreCase(request.toBankCode());

        if (isInternal) {
            Account destAccount = accountRepository.findByAccountNumberForUpdate(request.toAccountNumber())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Không tìm thấy tài khoản người nhận '" + request.toAccountNumber() + "' tại VinaTrust Bank"));

            if (destAccount.getId().equals(sourceAccount.getId())) {
                throw new BusinessRuleException("Tài khoản nhận không được trùng với tài khoản chuyển");
            }

            destAccount.credit(request.amount());
            accountRepository.save(destAccount);
        }

        // 7. Generate Reference Code and save transaction record
        String refCode = "TRF" + System.currentTimeMillis() + (1000 + random.nextInt(9000));
        Transaction tx = new Transaction(
                UUID.randomUUID(),
                refCode,
                sourceAccount.getId(),
                request.toAccountNumber(),
                request.toBankCode(),
                request.amount(),
                fee,
                channel,
                authMethod,
                request.description(),
                TransactionStatus.SUCCESS
        );
        Transaction savedTx = transactionRepository.save(tx);

        // 8. Publish Integration Event
        eventPublisher.publishEvent(new TransactionCompletedEvent(
                savedTx.getId(),
                savedTx.getReferenceCode(),
                savedTx.getFromAccountId(),
                savedTx.getToAccountNumber(),
                savedTx.getToBankCode(),
                savedTx.getAmount(),
                savedTx.getFee(),
                savedTx.getTransferChannel().name(),
                savedTx.getStatus().name(),
                Instant.now()
        ));

        return new TransferResponse(
                savedTx.getId(),
                savedTx.getReferenceCode(),
                sourceAccount.getAccountNumber(),
                savedTx.getToAccountNumber(),
                savedTx.getToBankCode(),
                savedTx.getAmount(),
                savedTx.getFee(),
                savedTx.getDescription(),
                savedTx.getStatus().name(),
                sourceAccount.getBalance(),
                savedTx.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public List<TransferResponse> getTransactionHistory(UUID accountId, UUID userId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại"));

        if (!account.getUserId().equals(userId)) {
            throw new BusinessRuleException("Bạn không có quyền xem lịch sử giao dịch của tài khoản này");
        }

        return transactionRepository.findByFromAccountIdOrderByCreatedAtDesc(accountId).stream()
                .map(tx -> new TransferResponse(
                        tx.getId(),
                        tx.getReferenceCode(),
                        account.getAccountNumber(),
                        tx.getToAccountNumber(),
                        tx.getToBankCode(),
                        tx.getAmount(),
                        tx.getFee(),
                        tx.getDescription(),
                        tx.getStatus().name(),
                        account.getBalance(),
                        tx.getCreatedAt()
                ))
                .toList();
    }
}

