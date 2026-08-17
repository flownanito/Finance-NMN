package com.nmn.financeadvisor.config;

import com.nmn.financeadvisor.model.Transaction;
import com.nmn.financeadvisor.model.Invoice;
import com.nmn.financeadvisor.repository.TransactionRepository;
import com.nmn.financeadvisor.repository.InvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Override
    public void run(String... args) throws Exception {
        System.out.println(">>> DatabaseSeeder is disabled. Starting with a fresh/existing database.");
    }
}
