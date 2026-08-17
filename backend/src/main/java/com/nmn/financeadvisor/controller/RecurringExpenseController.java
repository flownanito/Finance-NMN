package com.nmn.financeadvisor.controller;

import com.nmn.financeadvisor.model.RecurringExpense;
import com.nmn.financeadvisor.repository.RecurringExpenseRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recurring-expenses")
@CrossOrigin(origins = "*", maxAge = 3600)
public class RecurringExpenseController {

    @Autowired
    private RecurringExpenseRepository recurringExpenseRepository;

    @GetMapping
    public List<RecurringExpense> getAllRecurringExpenses() {
        return recurringExpenseRepository.findAll();
    }

    @PostMapping
    public RecurringExpense createRecurringExpense(@Valid @RequestBody RecurringExpense expense) {
        return recurringExpenseRepository.save(expense);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecurringExpense> updateRecurringExpense(@PathVariable Long id, @Valid @RequestBody RecurringExpense expenseDetails) {
        return recurringExpenseRepository.findById(id)
                .map(expense -> {
                    expense.setDescription(expenseDetails.getDescription());
                    expense.setAmount(expenseDetails.getAmount());
                    expense.setCategory(expenseDetails.getCategory());
                    expense.setDepartment(expenseDetails.getDepartment());
                    expense.setFrequency(expenseDetails.getFrequency());
                    expense.setExecutionDay(expenseDetails.getExecutionDay());
                    expense.setNextExecutionDate(expenseDetails.getNextExecutionDate());
                    expense.setIsActive(expenseDetails.getIsActive());
                    return ResponseEntity.ok(recurringExpenseRepository.save(expense));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecurringExpense(@PathVariable Long id) {
        if (!recurringExpenseRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        recurringExpenseRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
