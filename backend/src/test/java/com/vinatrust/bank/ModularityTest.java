package com.vinatrust.bank;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

class ModularityTest {

    @Test
    void verifyModularity() {
        // Enforces strict modular boundaries between modules (shared, identity, etc.)
        ApplicationModules modules = ApplicationModules.of(VinaTrustBankApplication.class);
        modules.verify();
    }
}

