package com.vinatrust.bank.banking.internal.api;

import com.vinatrust.bank.banking.internal.api.dto.CardResponse;
import com.vinatrust.bank.banking.internal.api.dto.IssueCardRequest;
import com.vinatrust.bank.banking.internal.application.CardService;
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
@RequestMapping("/api/v1/banking/cards")
@PreAuthorize("isAuthenticated()")
public class CardController {

    private final CardService cardService;

    public CardController(CardService cardService) {
        this.cardService = cardService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CardResponse>>> getMyCards() {
        UUID userId = SecurityUtils.getCurrentUserId();
        List<CardResponse> cards = cardService.getCardsByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thẻ thành công", cards));
    }

    @PostMapping("/issue")
    public ResponseEntity<ApiResponse<CardResponse>> issueCard(@Valid @RequestBody IssueCardRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        CardResponse card = cardService.issueCard(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Phát hành thẻ mới thành công", card));
    }

    @PostMapping("/{id}/lock")
    public ResponseEntity<ApiResponse<CardResponse>> lockCard(@PathVariable UUID id) {
        UUID userId = SecurityUtils.getCurrentUserId();
        CardResponse card = cardService.lockCard(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Khóa thẻ thành công", card));
    }

    @PostMapping("/{id}/unlock")
    public ResponseEntity<ApiResponse<CardResponse>> unlockCard(@PathVariable UUID id) {
        UUID userId = SecurityUtils.getCurrentUserId();
        CardResponse card = cardService.unlockCard(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Mở khóa thẻ thành công", card));
    }

    @PostMapping("/{id}/report-lost")
    public ResponseEntity<ApiResponse<CardResponse>> reportLostCard(@PathVariable UUID id) {
        UUID userId = SecurityUtils.getCurrentUserId();
        CardResponse card = cardService.reportLostCard(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Báo mất thẻ thành công. Thẻ đã được vô hiệu hóa vĩnh viễn", card));
    }
}

