package com.vinatrust.bank.shared.exception;

/**
 * Thrown when an expected entity/resource is not found.
 */
public class ResourceNotFoundException extends DomainException {

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue));
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }
}

