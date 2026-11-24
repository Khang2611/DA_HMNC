package com.vinatrust.bank.banking.internal.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record TransferRequest(
    @NotNull(message = "Tài khoản nguồn không được để trống")
    UUID fromAccountId,

    @NotBlank(message = "Số tài khoản nhận không được để trống")
    String toAccountNumber,

    @NotBlank(message = "Mã ngân hàng nhận không được để trống")
    String toBankCode,

    @NotNull(message = "Số tiền chuyển không được để trống")
    @DecimalMin(value = "2000.0", message = "Số tiền chuyển tối thiểu là 2.000 ₫")
    BigDecimal amount,

    @NotBlank(message = "Kênh chuyển tiền không được để trống")
    String transferChannel,

    String authMethod,

    String description
) {
}

