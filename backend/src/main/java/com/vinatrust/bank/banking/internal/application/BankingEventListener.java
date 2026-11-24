package com.vinatrust.bank.banking.internal.application;

import com.vinatrust.bank.identity.contracts.events.UserRegisteredEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class BankingEventListener {

    private static final Logger log = LoggerFactory.getLogger(BankingEventListener.class);

    private final AccountService accountService;

    public BankingEventListener(AccountService accountService) {
        this.accountService = accountService;
    }

    /**
     * Listens to UserRegisteredEvent published by Identity module AFTER_COMMIT.
     * Automatically provisions a default Checking Payment Account for the new user.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onUserRegistered(UserRegisteredEvent event) {
        log.info("Received UserRegisteredEvent for user: {} (ID: {}). Auto-provisioning default account...",
                event.username(), event.userId());
        try {
            accountService.createDefaultAccount(event.userId());
            log.info("Successfully provisioned default account for user {}", event.username());
        } catch (Exception e) {
            log.error("Failed to auto-provision account for user {}: ", event.username(), e);
        }
    }
}

