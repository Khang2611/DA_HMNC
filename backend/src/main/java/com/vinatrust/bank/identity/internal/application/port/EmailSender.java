package com.vinatrust.bank.identity.internal.application.port;

public interface EmailSender {

    void sendVerificationOtp(String toEmail, String fullName, String otpCode, int expirationMinutes);
}

