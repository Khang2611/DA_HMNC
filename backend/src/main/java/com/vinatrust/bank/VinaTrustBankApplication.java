package com.vinatrust.bank;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class VinaTrustBankApplication {

    public static void main(String[] args) {
        SpringApplication.run(VinaTrustBankApplication.class, args);
    }
}

