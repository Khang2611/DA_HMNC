package com.vinatrust.bank.identity.internal.api.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Tên đăng nhập, email hoặc số điện thoại không được để trống")
        String identifier,

        @NotBlank(message = "Mật khẩu không được để trống")
        String password
) {
}

