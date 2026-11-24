package com.vinatrust.bank.identity.internal.api;

import com.vinatrust.bank.identity.internal.api.dto.UpdateUserRoleRequest;
import com.vinatrust.bank.identity.internal.api.dto.UserProfileResponse;
import com.vinatrust.bank.identity.internal.application.AdminUserService;
import com.vinatrust.bank.identity.internal.domain.Role;
import com.vinatrust.bank.shared.api.ApiResponse;
import com.vinatrust.bank.shared.util.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<UserProfileResponse>>> getUsers(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<UserProfileResponse> users = adminUserService.getUsers(role, keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách người dùng thành công", users));
    }

    @PatchMapping("/{userId}/role")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateUserRole(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserRoleRequest request
    ) {
        UUID currentAdminId = SecurityUtils.getCurrentUserId();
        UserProfileResponse response = adminUserService.updateUserRole(userId, request, currentAdminId);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật vai trò người dùng thành công", response));
    }
}

