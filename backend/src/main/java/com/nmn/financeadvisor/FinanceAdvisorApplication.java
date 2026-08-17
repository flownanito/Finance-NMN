package com.nmn.financeadvisor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FinanceAdvisorApplication {
    public static void main(String[] args) {
        SpringApplication.run(FinanceAdvisorApplication.class, args);
    }
}
