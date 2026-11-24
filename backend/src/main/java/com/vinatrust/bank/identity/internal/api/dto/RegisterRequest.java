package com.vinatrust.bank.identity.internal.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Tên đăng nhập không được để trống")
        @Size(min = 4, max = 50, message = "Tên đăng nhập phải từ 4 đến 50 ký tự")
        @Pattern(regexp = "^\\S+$", message = "Tên đăng nhập không được chứa khoảng trắng")
        String username,

        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không đúng định dạng")
        String email,

        @NotBlank(message = "Số điện thoại không được để trống")
        @Pattern(regexp = "^(0|\\+84)\\d{9}$", message = "Số điện thoại không đúng định dạng Việt Nam")
        String phone,

        @NotBlank(message = "Họ và tên không được để trống")
        @Size(max = 120, message = "Họ và tên không được vượt quá 120 ký tự")
        String fullName,

        String dateOfBirth,

        @NotBlank(message = "Mật khẩu không được để trống")
        @Size(min = 8, max = 64, message = "Mật khẩu phải từ 8 đến 64 ký tự")
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,64}$",
                message = "Mật khẩu phải từ 8 đến 64 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
        )
        String password,

        @Pattern(regexp = "^[0-9]{6}$", message = "Mã PIN giao dịch phải gồm đúng 6 chữ số")
        String transactionPin
) {
}
