package com.vinatrust.bank.banking.internal.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.UUID;

public record IssueCardRequest(
    @NotNull(message = "Tài khoản liên kết không được để trống")
    UUID accountId,

    @NotBlank(message = "Loại thẻ không được để trống")
    String cardType,

    boolean isVirtual,

    @Pattern(regexp = "^[0-9]{6}$", message = "Mã PIN thẻ phải là 6 chữ số")
    String pin
) {
}

