package com.vinatrust.bank.identity.internal.api.dto;

import com.vinatrust.bank.identity.internal.domain.Role;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(
        @NotNull(message = "Vai trò không được để trống")
        Role role,

        String assignedTeam
) {
}

