package com.vinatrust.bank.banking.internal.api;

import com.vinatrust.bank.banking.internal.api.dto.AccountResponse;
import com.vinatrust.bank.banking.internal.application.AccountService;
import com.vinatrust.bank.shared.api.ApiResponse;
import com.vinatrust.bank.shared.util.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/banking/accounts")
@PreAuthorize("isAuthenticated()")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AccountResponse>>> getMyAccounts() {
        UUID userId = SecurityUtils.getCurrentUserId();
        List<AccountResponse> accounts = accountService.getAccountsByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tài khoản thành công", accounts));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AccountResponse>> getAccountById(@PathVariable UUID id) {
        UUID userId = SecurityUtils.getCurrentUserId();
        AccountResponse account = accountService.getAccountById(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin tài khoản thành công", account));
    }
}

