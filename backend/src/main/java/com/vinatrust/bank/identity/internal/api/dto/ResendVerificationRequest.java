package com.vinatrust.bank.identity.internal.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ResendVerificationRequest(
        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không đúng định dạng")
        String email
) {
}

