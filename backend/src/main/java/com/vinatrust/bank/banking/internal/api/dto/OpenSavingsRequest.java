package com.vinatrust.bank.banking.internal.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record OpenSavingsRequest(
    @NotNull(message = "Tài khoản nguồn trích tiền không được để trống")
    UUID sourceAccountId,

    @NotNull(message = "Số tiền gửi tiết kiệm không được để trống")
    @DecimalMin(value = "1000000.0", message = "Số tiền gửi tiết kiệm tối thiểu là 1.000.000 ₫")
    BigDecimal principalAmount,

    @Min(value = 1, message = "Kỳ hạn gửi tối thiểu là 1 tháng")
    @Max(value = 36, message = "Kỳ hạn gửi tối đa là 36 tháng")
    int termMonths
) {
}

