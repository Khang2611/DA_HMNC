package com.vinatrust.bank.identity.internal.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Tên đăng nhập không được để trống")
        @Size(min = 4, max = 50, message = "Tên đăng nhập phải từ 4 đến 50 ký tự")
        @Pattern(regexp = "^[a-zA-Z0-9_.-]+$", message = "Tên đăng nhập chỉ chứa chữ cái, chữ số, gạch dưới, gạch ngang và dấu chấm")
        String username,

        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không đúng định dạng")
        String email,

        @NotBlank(message = "Số điện thoại không được để trống")
        @Pattern(regexp = "^(0|\\+84)[0-9]{9}$", message = "Số điện thoại không đúng định dạng Việt Nam")
        String phone,

        @NotBlank(message = "Họ và tên không được để trống")
        @Size(min = 2, max = 100, message = "Họ và tên từ 2 đến 100 ký tự")
        String fullName,

        String dateOfBirth,

        @NotBlank(message = "Mật khẩu không được để trống")
        @Size(min = 8, max = 100, message = "Mật khẩu phải có ít nhất 8 ký tự")
        String password,

        @Pattern(regexp = "^[0-9]{6}$", message = "Mã PIN giao dịch phải gồm đúng 6 chữ số")
        String transactionPin
) {
}

