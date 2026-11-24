package com.vinatrust.bank.banking.internal.domain;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class FeePolicy {

    private static final BigDecimal NAPAS_STANDARD_FEE = new BigDecimal("2200.0000"); // 2,200 VND

    public BigDecimal calculateFee(TransactionChannel channel, String customerTier) {
        // VIP / Premier Tier enjoys zero transaction fees across all channels
        if ("Mauve Premier".equalsIgnoreCase(customerTier) || "VIP".equalsIgnoreCase(customerTier)) {
            return BigDecimal.ZERO;
        }

        if (channel == TransactionChannel.INTERNAL || channel == TransactionChannel.QR_PAYMENT) {
            return BigDecimal.ZERO;
        }

        if (channel == TransactionChannel.NAPAS_247) {
            return NAPAS_STANDARD_FEE;
        }

        return BigDecimal.ZERO;
    }
}

