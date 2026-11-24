package com.vinatrust.bank.identity.internal.infrastructure.mail;

import com.vinatrust.bank.identity.internal.application.event.EmailVerificationRequestedEvent;
import com.vinatrust.bank.identity.internal.application.port.EmailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class VerificationEmailEventListener {

    private final EmailSender emailSender;

    public VerificationEmailEventListener(EmailSender emailSender) {
        this.emailSender = emailSender;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onEmailVerificationRequested(EmailVerificationRequestedEvent event) {
        emailSender.sendVerificationOtp(
                event.email(),
                event.fullName(),
                event.otpCode(),
                event.expirationMinutes()
        );
    }
}

