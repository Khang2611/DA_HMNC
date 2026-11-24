package com.vinatrust.bank.banking.internal.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record LoanApplicationRequest(
    @NotBlank(message = "Loại khoản vay không được để trống")
    String loanType,

    @NotNull(message = "Số tiền đề nghị vay không được để trống")
    @DecimalMin(value = "5000000.0", message = "Hạn mức vay tối thiểu là 5.000.000 ₫")
    BigDecimal requestedAmount,

    @Min(value = 3, message = "Thời hạn vay tối thiểu là 3 tháng")
    @Max(value = 360, message = "Thời hạn vay tối đa là 360 tháng")
    int termMonths,

    BigDecimal collateralValue,

    @NotNull(message = "Thu nhập bình quân hàng tháng không được để trống")
    @DecimalMin(value = "5000000.0", message = "Thu nhập tối thiểu là 5.000.000 ₫")
    BigDecimal monthlyIncome
) {
}

