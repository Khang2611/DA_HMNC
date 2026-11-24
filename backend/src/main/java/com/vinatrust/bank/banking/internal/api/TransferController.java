package com.vinatrust.bank.banking.internal.api;

import com.vinatrust.bank.banking.internal.api.dto.TransferRequest;
import com.vinatrust.bank.banking.internal.api.dto.TransferResponse;
import com.vinatrust.bank.banking.internal.application.TransferService;
import com.vinatrust.bank.shared.api.ApiResponse;
import com.vinatrust.bank.shared.util.SecurityUtils;
import jakarta.validation.Valid;
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
@RequestMapping("/api/v1/banking/transfers")
@PreAuthorize("isAuthenticated()")
public class TransferController {

    private final TransferService transferService;

    public TransferController(TransferService transferService) {
        this.transferService = transferService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TransferResponse>> transfer(@Valid @RequestBody TransferRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        TransferResponse response = transferService.transfer(request, userId);
        return ResponseEntity.ok(ApiResponse.success("Giao dịch chuyển tiền thành công", response));
    }

    @GetMapping("/history/{accountId}")
    public ResponseEntity<ApiResponse<List<TransferResponse>>> getHistory(@PathVariable UUID accountId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        List<TransferResponse> history = transferService.getTransactionHistory(accountId, userId);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử giao dịch thành công", history));
    }
}

