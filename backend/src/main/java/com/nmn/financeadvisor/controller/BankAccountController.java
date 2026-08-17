package com.nmn.financeadvisor.controller;

import com.nmn.financeadvisor.model.BankAccount;
import com.nmn.financeadvisor.repository.BankAccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/bank-account")
@CrossOrigin(origins = "*", maxAge = 3600)
public class BankAccountController {

    @Autowired
    private BankAccountRepository bankAccountRepository;

    @GetMapping
    public ResponseEntity<BankAccount> getBankAccount() {
        return bankAccountRepository.findById(1L)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(new BankAccount(1L, 0.0, LocalDateTime.now().toString())));
    }

    @PutMapping
    public ResponseEntity<BankAccount> updateBankAccount(@RequestBody BankAccount account) {
        account.setId(1L); // Siempre el registro 1
        account.setLastUpdated(LocalDateTime.now().toString());
        BankAccount saved = bankAccountRepository.save(account);
        return ResponseEntity.ok(saved);
    }
}
