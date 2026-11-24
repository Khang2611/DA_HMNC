package com.vinatrust.bank.banking.internal.api;

import com.vinatrust.bank.banking.internal.api.dto.OpenSavingsRequest;
import com.vinatrust.bank.banking.internal.api.dto.SavingsResponse;
import com.vinatrust.bank.banking.internal.application.SavingsService;
import com.vinatrust.bank.shared.api.ApiResponse;
import com.vinatrust.bank.shared.util.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/banking/savings")
@PreAuthorize("isAuthenticated()")
public class SavingsController {

    private final SavingsService savingsService;

    public SavingsController(SavingsService savingsService) {
        this.savingsService = savingsService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SavingsResponse>>> getMySavings() {
        UUID userId = SecurityUtils.getCurrentUserId();
        List<SavingsResponse> savings = savingsService.getSavingsByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách sổ tiết kiệm thành công", savings));
    }

    @PostMapping("/open")
    public ResponseEntity<ApiResponse<SavingsResponse>> openSavings(@Valid @RequestBody OpenSavingsRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        SavingsResponse savings = savingsService.openSavings(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Mở sổ tiết kiệm trực tuyến thành công", savings));
    }

    @PostMapping("/{id}/settle")
    public ResponseEntity<ApiResponse<SavingsResponse>> settleSavings(@PathVariable UUID id) {
        UUID userId = SecurityUtils.getCurrentUserId();
        SavingsResponse savings = savingsService.settleSavings(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Tất toán sổ tiết kiệm thành công", savings));
    }
}

