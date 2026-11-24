package com.vinatrust.bank.shared.exception;

/**
 * Base abstract domain exception for business and domain logic violations.
 */
public class DomainException extends RuntimeException {

    public DomainException(String message) {
        super(message);
    }

    public DomainException(String message, Throwable cause) {
        super(message, cause);
    }
}

