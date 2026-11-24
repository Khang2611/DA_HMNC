package com.vinatrust.bank.banking.internal.application.mapper;

import com.vinatrust.bank.banking.contracts.dto.AccountOverviewDto;
import com.vinatrust.bank.banking.internal.api.dto.AccountResponse;
import com.vinatrust.bank.banking.internal.api.dto.CardResponse;
import com.vinatrust.bank.banking.internal.api.dto.LoanResponse;
import com.vinatrust.bank.banking.internal.api.dto.SavingsResponse;
import com.vinatrust.bank.banking.internal.api.dto.TransactionResponse;
import com.vinatrust.bank.banking.internal.domain.Account;
import com.vinatrust.bank.banking.internal.domain.Card;
import com.vinatrust.bank.banking.internal.domain.Loan;
import com.vinatrust.bank.banking.internal.domain.SavingsAccount;
import com.vinatrust.bank.banking.internal.domain.Transaction;
import org.springframework.stereotype.Component;

@Component
public class BankingMapper {

    public AccountResponse toAccountResponse(Account account) {
        if (account == null) return null;
        return new AccountResponse(
                account.getId(),
                account.getUserId(),
                account.getAccountNumber(),
                account.getBalance(),
                account.getDailyLimit(),
                account.getCurrency(),
                account.getStatus().name(),
                account.getCreatedAt()
        );
    }

    public AccountOverviewDto toAccountOverviewDto(Account account) {
        if (account == null) return null;
        return new AccountOverviewDto(
                account.getId(),
                account.getUserId(),
                account.getAccountNumber(),
                account.getBalance(),
                account.getDailyLimit(),
                account.getCurrency(),
                account.getStatus().name()
        );
    }

    public TransactionResponse toTransactionResponse(Transaction tx) {
        if (tx == null) return null;
        return new TransactionResponse(
                tx.getId(),
                tx.getReferenceCode(),
                tx.getFromAccountId(),
                tx.getToAccountNumber(),
                tx.getToBankCode(),
                tx.getAmount(),
                tx.getFee(),
                tx.getTransferChannel().name(),
                tx.getAuthMethod().name(),
                tx.getDescription(),
                tx.getStatus().name(),
                tx.getCreatedAt()
        );
    }

    public CardResponse toCardResponse(Card card) {
        if (card == null) return null;
        return new CardResponse(
                card.getId(),
                card.getUserId(),
                card.getAccountId(),
                card.getCardNumberMasked(),
                card.getCardLast4(),
                card.getCardType().name(),
                card.isVirtual(),
                card.getCreditLimit(),
                card.getStatus().name(),
                card.getExpiredAt(),
                card.getCreatedAt()
        );
    }

    public SavingsResponse toSavingsResponse(SavingsAccount savings) {
        if (savings == null) return null;
        return new SavingsResponse(
                savings.getId(),
                savings.getUserId(),
                savings.getSourceAccountId(),
                savings.getPrincipalAmount(),
                savings.getTermMonths(),
                savings.getInterestRate(),
                savings.getStatus().name(),
                savings.getOpenedAt(),
                savings.getMaturityDate()
        );
    }

    public LoanResponse toLoanResponse(Loan loan) {
        if (loan == null) return null;
        return new LoanResponse(
                loan.getId(),
                loan.getUserId(),
                loan.getLoanType().name(),
                loan.getRequestedAmount(),
                loan.getTermMonths(),
                loan.getInterestRate(),
                loan.getCollateralValue(),
                loan.getMonthlyIncome(),
                loan.getStatus().name(),
                loan.getCreatedAt()
        );
    }
}

