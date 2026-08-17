package com.nmn.financeadvisor.service;

import com.nmn.financeadvisor.model.BankAccount;
import com.nmn.financeadvisor.model.RecurringExpense;
import com.nmn.financeadvisor.model.Transaction;
import com.nmn.financeadvisor.repository.BankAccountRepository;
import com.nmn.financeadvisor.repository.RecurringExpenseRepository;
import com.nmn.financeadvisor.repository.TransactionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Slf4j
public class RecurringTaskService {

    @Autowired
    private RecurringExpenseRepository recurringExpenseRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private BankAccountRepository bankAccountRepository;

    // Ejecutar cada día a la 01:00 AM
    @Scheduled(cron = "0 0 1 * * ?")
    public void processRecurringExpenses() {
        log.info("[RECURRING] Iniciando procesamiento de gastos recurrentes...");
        LocalDate today = LocalDate.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        List<RecurringExpense> activeExpenses = recurringExpenseRepository.findByIsActiveTrue();

        for (RecurringExpense expense : activeExpenses) {
            LocalDate nextExec;
            if (expense.getNextExecutionDate() == null || expense.getNextExecutionDate().isEmpty()) {
                // Si no tiene fecha, calcular la siguiente basada en hoy
                nextExec = calculateNextExecution(expense, today);
                expense.setNextExecutionDate(nextExec.format(formatter));
                recurringExpenseRepository.save(expense);
                continue;
            } else {
                nextExec = LocalDate.parse(expense.getNextExecutionDate(), formatter);
            }

            // Si la fecha de ejecución es hoy o ya pasó
            if (!nextExec.isAfter(today)) {
                log.info("[RECURRING] Ejecutando gasto recurrente ID: {} - {}", expense.getId(), expense.getDescription());
                
                // 1. Crear transacción
                Transaction tx = new Transaction();
                tx.setDescription(expense.getDescription() + " (Auto)");
                tx.setAmount(expense.getAmount());
                tx.setType("EXPENSE");
                tx.setCategory(expense.getCategory());
                tx.setDepartment(expense.getDepartment());
                tx.setDate(today.format(formatter));
                tx.setIsFuga(false);
                tx.setFugaReason("");
                transactionRepository.save(tx);

                // 2. Descontar del banco
                updateBankBalance(-expense.getAmount());

                // 3. Programar el siguiente
                LocalDate next = calculateNextExecution(expense, today);
                expense.setNextExecutionDate(next.format(formatter));
                recurringExpenseRepository.save(expense);
            }
        }
    }

    private LocalDate calculateNextExecution(RecurringExpense expense, LocalDate fromDate) {
        switch (expense.getFrequency()) {
            case "MONTHLY":
                // Si el día pedido es mayor que los días del mes (ej. pide 31 en Febrero), usamos el último día del mes
                LocalDate nextMonth = fromDate.plusMonths(1);
                int day = Math.min(expense.getExecutionDay(), nextMonth.lengthOfMonth());
                return nextMonth.withDayOfMonth(day);
            case "WEEKLY":
                return fromDate.plusWeeks(1);
            case "YEARLY":
                return fromDate.plusYears(1).withDayOfYear(Math.min(expense.getExecutionDay(), fromDate.plusYears(1).lengthOfYear()));
            default:
                return fromDate.plusMonths(1);
        }
    }

    private void updateBankBalance(Double amountChange) {
        BankAccount account = bankAccountRepository.findById(1L).orElse(new BankAccount(1L, 0.0, LocalDateTime.now().toString()));
        account.setBalance(account.getBalance() + amountChange);
        account.setLastUpdated(LocalDateTime.now().toString());
        bankAccountRepository.save(account);
    }
}
