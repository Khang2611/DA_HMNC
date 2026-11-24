package com.vinatrust.bank.shared.util;

import com.vinatrust.bank.shared.exception.DomainException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getCredentials() instanceof UUID userId)) {
            throw new DomainException("Phiên đăng nhập không hợp lệ hoặc đã hết hạn");
        }
        return userId;
    }
}

