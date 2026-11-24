package com.vinatrust.bank.banking.contracts;

import com.vinatrust.bank.banking.contracts.dto.AccountOverviewDto;

import java.util.Optional;
import java.util.UUID;

/**
 * Public synchronous contract interface for Banking module.
 * Used by Support/Ticket or Agent/Lead modules to handle customer incidents (e.g., P1 freeze account/card).
 */
public interface BankingSupportContract {

    void freezeAccount(UUID accountId, String reason);

    void unfreezeAccount(UUID accountId, String reason);

    void permanentlyLockCard(UUID cardId, String reason);

    Optional<AccountOverviewDto> getAccountOverview(UUID accountId);
}

