package com.vinatrust.bank.banking.internal.domain;

import com.vinatrust.bank.shared.exception.BusinessRuleException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Enforces State Bank of Vietnam (Decision 2345/QĐ-NHNN) biometric authentication rules:
 * - Single transaction >= 10,000,000 VND strictly requires biometric verification.
 * - Transaction must not exceed account daily limit.
 */
@Component
public class BiometricLimitPolicy {

    public static final BigDecimal BIOMETRIC_THRESHOLD = new BigDecimal("10000000.0000"); // 10 Million VND

    public void validateTransfer(
            BigDecimal amount,
            Account account,
            boolean isBiometricVerified,
            AuthMethod authMethod
    ) {
        if (amount.compareTo(account.getDailyLimit()) > 0) {
            throw new BusinessRuleException("Số tiền giao dịch vượt quá hạn mức chuyển khoản trong ngày của tài khoản (" +
                    account.getDailyLimit() + " " + account.getCurrency() + ")");
        }

        if (amount.compareTo(BIOMETRIC_THRESHOLD) >= 0) {
            if (!isBiometricVerified) {
                throw new BusinessRuleException(
                        "Theo quy định QĐ 2345/QĐ-NHNN, giao dịch từ 10.000.000 ₫ trở lên bắt buộc tài khoản phải hoàn tất xác thực sinh trắc học eKYC.");
            }
            if (authMethod != AuthMethod.BIOMETRIC) {
                throw new BusinessRuleException(
                        "Giao dịch từ 10.000.000 ₫ trở lên bắt buộc phải xác thực bằng phương thức Sinh trắc học (FaceID / Vân tay).");
            }
        }
    }
}

