package com.vinatrust.bank.banking.internal.application;

import com.vinatrust.bank.banking.internal.api.dto.TransferRequest;
import com.vinatrust.bank.banking.internal.api.dto.TransferResponse;
import com.vinatrust.bank.banking.internal.application.mapper.BankingMapper;
import com.vinatrust.bank.banking.internal.domain.Account;
import com.vinatrust.bank.banking.internal.domain.AccountRepository;
import com.vinatrust.bank.banking.internal.domain.AccountStatus;
import com.vinatrust.bank.banking.internal.domain.BiometricLimitPolicy;
import com.vinatrust.bank.banking.internal.domain.FeePolicy;
import com.vinatrust.bank.banking.internal.domain.Transaction;
import com.vinatrust.bank.banking.internal.domain.TransactionRepository;
import com.vinatrust.bank.identity.contracts.IdentityQueryContract;
import com.vinatrust.bank.identity.contracts.dto.UserSummaryDto;
import com.vinatrust.bank.shared.exception.BusinessRuleException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransferServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private IdentityQueryContract identityQueryContract;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private final BiometricLimitPolicy biometricLimitPolicy = new BiometricLimitPolicy();
    private final FeePolicy feePolicy = new FeePolicy();
    private final BankingMapper bankingMapper = new BankingMapper();

    private TransferService transferService;

    private UUID userId;
    private UUID sourceAccountId;
    private Account sourceAccount;

    @BeforeEach
    void setUp() {
        transferService = new TransferService(
                accountRepository,
                transactionRepository,
                identityQueryContract,
                biometricLimitPolicy,
                feePolicy,
                eventPublisher,
                bankingMapper
        );

        userId = UUID.randomUUID();
        sourceAccountId = UUID.randomUUID();
        sourceAccount = new Account(
                sourceAccountId,
                userId,
                "1029384756",
                new BigDecimal("50000000.0000"), // 50M balance
                new BigDecimal("100000000.0000"), // 100M daily limit
                "VND",
                AccountStatus.ACTIVE
        );
    }

    @Test
    @DisplayName("Chuyển tiền nội bộ thành công: trừ tài khoản nguồn, cộng tài khoản đích")
    void transfer_Internal_Success() {
        UUID destAccountId = UUID.randomUUID();
        Account destAccount = new Account(
                destAccountId,
                UUID.randomUUID(),
                "9876543210",
                new BigDecimal("10000000.0000"),
                new BigDecimal("50000000.0000"),
                "VND",
                AccountStatus.ACTIVE
        );

        UserSummaryDto user = new UserSummaryDto(
                userId, "customer1", "Quý Nguyễn", "quy@bank.vn", "0901234567",
                "CUSTOMER", "ACTIVE", "VERIFIED", "Mauve Premier", true
        );

        TransferRequest request = new TransferRequest(
                sourceAccountId,
                "9876543210",
                "VINATRUST",
                new BigDecimal("5000000.0000"),
                "INTERNAL",
                "PIN",
                "Chuyen tien hoc phi"
        );

        when(identityQueryContract.findUserById(userId)).thenReturn(Optional.of(user));
        when(accountRepository.findByIdForUpdate(sourceAccountId)).thenReturn(Optional.of(sourceAccount));
        when(accountRepository.findByAccountNumberForUpdate("9876543210")).thenReturn(Optional.of(destAccount));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

        TransferResponse response = transferService.transfer(request, userId);

        assertThat(response).isNotNull();
        assertThat(response.amount()).isEqualByComparingTo("5000000.0000");
        assertThat(response.status()).isEqualTo("SUCCESS");
        assertThat(sourceAccount.getBalance()).isEqualByComparingTo("45000000.0000");
        assertThat(destAccount.getBalance()).isEqualByComparingTo("15000000.0000");

        verify(eventPublisher, times(1)).publishEvent(any());
    }

    @Test
    @DisplayName("Chuyển tiền thất bại khi số dư không đủ")
    void transfer_InsufficientBalance_ThrowsException() {
        UserSummaryDto user = new UserSummaryDto(
                userId, "customer1", "Quý Nguyễn", "quy@bank.vn", "0901234567",
                "CUSTOMER", "ACTIVE", "VERIFIED", "STANDARD", true
        );

        TransferRequest request = new TransferRequest(
                sourceAccountId,
                "9876543210",
                "VCB",
                new BigDecimal("60000000.0000"), // 60M > 50M
                "NAPAS_247",
                "BIOMETRIC",
                "Mua oto"
        );

        when(identityQueryContract.findUserById(userId)).thenReturn(Optional.of(user));
        when(accountRepository.findByIdForUpdate(sourceAccountId)).thenReturn(Optional.of(sourceAccount));

        assertThatThrownBy(() -> transferService.transfer(request, userId))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Số dư tài khoản không đủ");

        verify(transactionRepository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("Giao dịch từ 10 triệu bắt buộc xác thực sinh trắc học theo QĐ 2345/QĐ-NHNN")
    void transfer_Over10M_RequiresBiometric() {
        UserSummaryDto userUnverified = new UserSummaryDto(
                userId, "customer1", "Quý Nguyễn", "quy@bank.vn", "0901234567",
                "CUSTOMER", "ACTIVE", "UNVERIFIED", "STANDARD", false
        );

        TransferRequest request = new TransferRequest(
                sourceAccountId,
                "9876543210",
                "VCB",
                new BigDecimal("15000000.0000"), // 15M >= 10M
                "NAPAS_247",
                "PIN",
                "Chuyen tien lon"
        );

        when(identityQueryContract.findUserById(userId)).thenReturn(Optional.of(userUnverified));
        when(accountRepository.findByIdForUpdate(sourceAccountId)).thenReturn(Optional.of(sourceAccount));

        assertThatThrownBy(() -> transferService.transfer(request, userId))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("QĐ 2345/QĐ-NHNN");
    }
}

