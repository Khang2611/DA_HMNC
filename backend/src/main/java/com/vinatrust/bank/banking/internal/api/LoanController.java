package com.vinatrust.bank.banking.internal.api;

import com.vinatrust.bank.banking.internal.api.dto.LoanApplicationRequest;
import com.vinatrust.bank.banking.internal.api.dto.LoanResponse;
import com.vinatrust.bank.banking.internal.application.LoanService;
import com.vinatrust.bank.shared.api.ApiResponse;
import com.vinatrust.bank.shared.util.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/banking/loans")
@PreAuthorize("isAuthenticated()")
public class LoanController {

    private final LoanService loanService;

    public LoanController(LoanService loanService) {
        this.loanService = loanService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<LoanResponse>>> getMyLoans() {
        UUID userId = SecurityUtils.getCurrentUserId();
        List<LoanResponse> loans = loanService.getLoansByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách khoản vay thành công", loans));
    }

    @PostMapping("/apply")
    public ResponseEntity<ApiResponse<LoanResponse>> applyLoan(@Valid @RequestBody LoanApplicationRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        LoanResponse loan = loanService.applyLoan(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Gửi hồ sơ đăng ký khoản vay thành công", loan));
    }
}

