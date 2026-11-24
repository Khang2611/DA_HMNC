package com.vinatrust.bank.shared.exception;

/**
 * Thrown when a banking or business invariant rule is violated.
 */
public class BusinessRuleException extends DomainException {

    public BusinessRuleException(String message) {
        super(message);
    }
}

