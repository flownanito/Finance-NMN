package com.nmn.financeadvisor.controller;

import com.nmn.financeadvisor.model.Transaction;
import com.nmn.financeadvisor.model.Invoice;
import com.nmn.financeadvisor.model.FinanceClosure;
import com.nmn.financeadvisor.model.BankAccount;
import com.nmn.financeadvisor.repository.TransactionRepository;
import com.nmn.financeadvisor.repository.InvoiceRepository;
import com.nmn.financeadvisor.repository.FinanceClosureRepository;
import com.nmn.financeadvisor.repository.BankAccountRepository;

import jakarta.validation.Valid;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.StringWriter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api")
public class FinanceController {

    private static final Logger log = LoggerFactory.getLogger(FinanceController.class);

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;
    
    @Autowired
    private BankAccountRepository bankAccountRepository;

    private void updateBankBalance(Double amountChange) {
        BankAccount account = bankAccountRepository.findById(1L).orElse(new BankAccount(1L, 0.0, java.time.LocalDateTime.now().toString()));
        account.setBalance(account.getBalance() + amountChange);
        account.setLastUpdated(java.time.LocalDateTime.now().toString());
        bankAccountRepository.save(account);
    }

    @Autowired
    private FinanceClosureRepository financeClosureRepository;

    // --- TRANSACTIONS CRUD ---

    @GetMapping("/transactions")
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    @GetMapping("/transactions/{id}")
    public ResponseEntity<Transaction> getTransactionById(@PathVariable Long id) {
        return transactionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/transactions")
    public ResponseEntity<Transaction> createTransaction(@Valid @RequestBody Transaction transaction) {
        Transaction saved = transactionRepository.save(transaction);
        log.info("[AUDIT] Transacción creada: {} (Monto: {}, Tipo: {}, ID: {})", 
                saved.getDescription(), saved.getAmount(), saved.getType(), saved.getId());
        
        Double amountChange = "INCOME".equals(saved.getType()) ? saved.getAmount() : -saved.getAmount();
        updateBankBalance(amountChange);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/transactions/{id}")
    public ResponseEntity<Transaction> updateTransaction(@PathVariable Long id, @Valid @RequestBody Transaction transactionDetails) {
        return transactionRepository.findById(id)
                .map(transaction -> {
                    // Revertir el saldo antiguo
                    Double oldChange = "INCOME".equals(transaction.getType()) ? transaction.getAmount() : -transaction.getAmount();
                    updateBankBalance(-oldChange);

                    transaction.setDescription(transactionDetails.getDescription());
                    transaction.setAmount(transactionDetails.getAmount());
                    transaction.setType(transactionDetails.getType());
                    transaction.setCategory(transactionDetails.getCategory());
                    transaction.setDepartment(transactionDetails.getDepartment());
                    transaction.setDate(transactionDetails.getDate());
                    transaction.setIsFuga(transactionDetails.getIsFuga());
                    transaction.setFugaReason(transactionDetails.getFugaReason());
                    Transaction updated = transactionRepository.save(transaction);
                    
                    // Aplicar el nuevo saldo
                    Double newChange = "INCOME".equals(updated.getType()) ? updated.getAmount() : -updated.getAmount();
                    updateBankBalance(newChange);

                    log.info("[AUDIT] Transacción actualizada: ID {} ({})", id, updated.getDescription());
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/transactions/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long id) {
        return transactionRepository.findById(id)
                .map(transaction -> {
                    log.info("[AUDIT] Transacción eliminada: ID {} ({}, Monto: {})", id, transaction.getDescription(), transaction.getAmount());
                    
                    // Revertir el saldo
                    Double amountChange = "INCOME".equals(transaction.getType()) ? transaction.getAmount() : -transaction.getAmount();
                    updateBankBalance(-amountChange);

                    transactionRepository.delete(transaction);
                    return new ResponseEntity<Void>(HttpStatus.OK);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // --- INVOICES CRUD ---

    @GetMapping("/invoices")
    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    @GetMapping("/invoices/{id}")
    public ResponseEntity<Invoice> getInvoiceById(@PathVariable Long id) {
        return invoiceRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/invoices")
    public ResponseEntity<Invoice> createInvoice(@Valid @RequestBody Invoice invoice) {
        Invoice saved = invoiceRepository.save(invoice);
        log.info("[AUDIT] Factura creada: {} - Cliente: {} (Monto: {}, ID: {})", 
                saved.getInvoiceNumber(), saved.getClientName(), saved.getAmount(), saved.getId());
        
        // If the invoice is PAID, automatically log a transaction income
        if ("PAID".equals(saved.getStatus())) {
            Transaction tx = new Transaction(
                null,
                "Cobro Factura: " + saved.getClientName() + " (" + saved.getInvoiceNumber() + ")",
                saved.getAmount(),
                "INCOME",
                "Ventas",
                saved.getDepartment(),
                saved.getDate(),
                false,
                ""
            );
            transactionRepository.save(tx);
            updateBankBalance(saved.getAmount());
            log.info("[AUDIT] Transacción de ingreso creada automáticamente por cobro de factura {}", saved.getInvoiceNumber());
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/invoices/{id}")
    public ResponseEntity<Invoice> updateInvoice(@PathVariable Long id, @Valid @RequestBody Invoice details) {
        return invoiceRepository.findById(id)
                .map(existing -> {
                    boolean wasPaid = "PAID".equals(existing.getStatus());
                    boolean isPaid = "PAID".equals(details.getStatus());

                    existing.setClientName(details.getClientName());
                    existing.setInvoiceNumber(details.getInvoiceNumber());
                    existing.setAmount(details.getAmount());
                    existing.setDate(details.getDate());
                    existing.setConcept(details.getConcept());
                    existing.setStatus(details.getStatus());
                    existing.setDepartment(details.getDepartment());

                    Invoice saved = invoiceRepository.save(existing);
                    log.info("[AUDIT] Factura actualizada: ID {} ({})", id, saved.getInvoiceNumber());

                    // If transitioned from PENDING to PAID, register the Transaction income
                    if (!wasPaid && isPaid) {
                        Transaction tx = new Transaction(
                            null,
                            "Cobro Factura: " + saved.getClientName() + " (" + saved.getInvoiceNumber() + ")",
                            saved.getAmount(),
                            "INCOME",
                            "Ventas",
                            saved.getDepartment(),
                            saved.getDate(),
                            false,
                            ""
                        );
                        transactionRepository.save(tx);
                        log.info("[AUDIT] Transacción de ingreso creada automáticamente por transición de factura a COBRADA: {}", saved.getInvoiceNumber());
                    }

                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/invoices/{id}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long id) {
        return invoiceRepository.findById(id)
                .map(invoice -> {
                    log.info("[AUDIT] Factura eliminada: ID {} ({})", id, invoice.getInvoiceNumber());
                    invoiceRepository.delete(invoice);
                    return new ResponseEntity<Void>(HttpStatus.OK);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // --- DASHBOARD STATS ---

    @GetMapping("/dashboard/stats")
    public Map<String, Object> getDashboardStats() {
        List<Transaction> transactions = transactionRepository.findAll();
        List<Invoice> invoices = invoiceRepository.findAll();

        double incomeSum = 0.0;
        double expenseSum = 0.0;
        double activeLeaksSum = 0.0;
        int activeLeaksCount = 0;

        for (Transaction t : transactions) {
            if ("INCOME".equals(t.getType())) {
                incomeSum += t.getAmount();
            } else if ("EXPENSE".equals(t.getType())) {
                expenseSum += t.getAmount();
                if (t.getIsFuga()) {
                    activeLeaksSum += t.getAmount();
                    activeLeaksCount++;
                }
            }
        }

        // Invoice stats
        double totalInvoiced = 0.0;
        double pendingCollection = 0.0;
        for (Invoice inv : invoices) {
            totalInvoiced += inv.getAmount();
            if ("PENDING".equals(inv.getStatus())) {
                pendingCollection += inv.getAmount();
            }
        }

        // Calculate margins
        double netMargin = incomeSum > 0 ? ((incomeSum - expenseSum) / incomeSum) * 100.0 : 0.0;
        double operatingMargin = netMargin > 0 ? netMargin * 0.82 : 0.0;

        // Aggregate expenses by Department
        Map<String, Double> deptExpenses = new HashMap<>();
        deptExpenses.put("Ventas", 0.0);
        deptExpenses.put("IT", 0.0);
        deptExpenses.put("Marketing", 0.0);
        deptExpenses.put("Operaciones", 0.0);
        deptExpenses.put("RRHH", 0.0);

        for (Transaction t : transactions) {
            if ("EXPENSE".equals(t.getType())) {
                String dept = t.getDepartment();
                deptExpenses.put(dept, deptExpenses.getOrDefault(dept, 0.0) + t.getAmount());
            }
        }

        // Alerts & Warnings
        List<String> criticalAlerts = new ArrayList<>();
        if (activeLeaksCount > 0) {
            criticalAlerts.add(activeLeaksCount + " fugas de capital activas detectadas.");
        }
        
        for (Transaction t : transactions) {
            if (t.getIsFuga() && t.getDescription().toLowerCase().contains("roi negativo")) {
                criticalAlerts.add("Retorno negativo (pérdida de $" + t.getAmount() + ") en: " + t.getDescription());
            }
        }

        // Calculate monthly flow for the last 6 months
        LocalDate today = LocalDate.now();
        List<Map<String, Object>> monthlyFlow = new ArrayList<>();
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM", new Locale("es", "ES"));

        for (int i = 5; i >= 0; i--) {
            LocalDate monthDate = today.minusMonths(i);
            String monthName = monthDate.format(monthFormatter);
            monthName = monthName.substring(0, 1).toUpperCase() + monthName.substring(1); // Capitalize Ene
            
            double monthIncome = 0.0;
            double monthExpense = 0.0;
            
            for (Transaction t : transactions) {
                if (t.getDate() != null && !t.getDate().isEmpty()) {
                    try {
                        LocalDate tDate = LocalDate.parse(t.getDate());
                        if (tDate.getYear() == monthDate.getYear() && tDate.getMonthValue() == monthDate.getMonthValue()) {
                            if ("INCOME".equals(t.getType())) {
                                monthIncome += t.getAmount();
                            } else if ("EXPENSE".equals(t.getType())) {
                                monthExpense += t.getAmount();
                            }
                        }
                    } catch (Exception e) {
                        // ignore parse errors
                    }
                }
            }
            Map<String, Object> flowItem = new HashMap<>();
            flowItem.put("month", monthName);
            flowItem.put("income", monthIncome);
            flowItem.put("expense", monthExpense);
            monthlyFlow.add(flowItem);
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("netMargin", netMargin);
        stats.put("operatingMargin", operatingMargin);
        stats.put("lossesAvoided", activeLeaksSum); // Representa "Fugas Detectadas"
        stats.put("activeMembers", activeLeaksCount); // Usaremos este campo para contar cuantas fugas hay en el frontend
        stats.put("milestoneProgress", 94); // Mantenemos el progreso del CRM
        stats.put("totalIncome", incomeSum);
        stats.put("totalExpense", expenseSum);
        stats.put("departmentExpenses", deptExpenses);
        stats.put("leaksCount", activeLeaksCount);
        stats.put("criticalAlerts", criticalAlerts);
        stats.put("totalInvoiced", totalInvoiced);
        stats.put("pendingCollection", pendingCollection);
        stats.put("monthlyFlow", monthlyFlow);

        return stats;
    }

    // --- AI RECOMMENDATIONS ---

    @GetMapping("/finance/recommendations")
    public List<Map<String, Object>> getAiRecommendations() {
        List<Transaction> transactions = transactionRepository.findAll();
        List<Map<String, Object>> recs = new ArrayList<>();

        // 1. Detect duplicate subscriptions / services
        Map<String, Transaction> uniqueSubscriptions = new HashMap<>();
        for (Transaction t : transactions) {
            if ("EXPENSE".equals(t.getType()) && "Suscripciones".equalsIgnoreCase(t.getCategory())) {
                String normalizedDesc = t.getDescription().toLowerCase().replaceAll("\\s+", "");
                if (uniqueSubscriptions.containsKey(normalizedDesc)) {
                    Transaction first = uniqueSubscriptions.get(normalizedDesc);
                    Map<String, Object> rec = new HashMap<>();
                    rec.put("type", "DUPLICATE");
                    rec.put("severity", "HIGH");
                    rec.put("title", "Suscripción redundante detectada: " + t.getDescription());
                    rec.put("description", "Se ha detectado un cobro recurrente duplicado para '" + t.getDescription() + 
                            "' en el departamento de " + t.getDepartment() + " ($" + t.getAmount() + "/mes) y en " + 
                            first.getDepartment() + " ($" + first.getAmount() + "/mes).");
                    rec.put("savingPotential", t.getAmount());
                    rec.put("actionableTip", "Consolidar las licencias en una cuenta de facturación única para ahorrar $" + t.getAmount() + " al mes.");
                    recs.add(rec);
                } else {
                    uniqueSubscriptions.put(normalizedDesc, t);
                }
            }
        }

        // 2. Identify active leakages
        for (Transaction t : transactions) {
            if ("EXPENSE".equals(t.getType()) && t.getIsFuga()) {
                boolean alreadyAdded = false;
                for (Map<String, Object> r : recs) {
                    if (r.get("title").toString().contains(t.getDescription())) {
                        alreadyAdded = true;
                        break;
                    }
                }
                if (!alreadyAdded) {
                    Map<String, Object> rec = new HashMap<>();
                    rec.put("type", "LEAK");
                    rec.put("severity", t.getDescription().toLowerCase().contains("roi") ? "HIGH" : "MEDIUM");
                    rec.put("title", "Fuga de capital activa: " + t.getDescription());
                    rec.put("description", t.getFugaReason() != null ? t.getFugaReason() : "Gasto sin retorno financiero justificado.");
                    rec.put("savingPotential", t.getAmount());
                    rec.put("actionableTip", "Pausar o dar de baja el servicio para recortar inmediatamente $" + t.getAmount() + ".");
                    recs.add(rec);
                }
            }
        }

        if (recs.isEmpty()) {
            Map<String, Object> rec = new HashMap<>();
            rec.put("type", "OPTIMIZATION");
            rec.put("severity", "LOW");
            rec.put("title", "Salud financiera optimizada");
            rec.put("description", "El algoritmo no ha encontrado fugas de capital ni suscripciones duplicadas activas.");
            rec.put("savingPotential", 0.0);
            rec.put("actionableTip", "Seguir monitoreando los cierres diarios para detectar desviaciones de margen operativo.");
            recs.add(rec);
        }

        return recs;
    }

    // --- CRM / BANK SYNC SIMULATION ---

    @PostMapping("/finance/sync")
    public ResponseEntity<?> syncData() {
        log.info("[AUDIT] Sincronización financiera ejecutada con bancos y CRM");
        String todayStr = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);

        // Import new transaction
        Transaction newTx = new Transaction(
            null,
            "Abono Factura CRM - Cliente NMN Solutions",
            3450.00,
            "INCOME",
            "Ventas",
            "Ventas",
            todayStr,
            false,
            ""
        );
        Transaction saved = transactionRepository.save(newTx);
        
        // Also add corresponding invoice
        Invoice newInv = new Invoice(
            null,
            "NMN Solutions S.L.",
            "FAC-2026-" + String.format("%03d", new Random().nextInt(900) + 100),
            3450.00,
            todayStr,
            "Abono Automático Factura CRM",
            "PAID",
            "Ventas"
        );
        invoiceRepository.save(newInv);

        return ResponseEntity.ok(Map.of(
            "message", "Sincronización completada exitosamente.",
            "importedTransactions", List.of(saved),
            "updatedInvoicesCount", 1
        ));
    }

    // --- DAILY CLOSURE ---

    @GetMapping("/reports/closure/status")
    public ResponseEntity<?> getClosureStatus() {
        String today = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        Optional<FinanceClosure> closure = financeClosureRepository.findByDate(today);
        boolean closed = closure.map(FinanceClosure::getClosed).orElse(false);
        return ResponseEntity.ok(Map.of("closed", closed, "date", today));
    }

    @PostMapping("/reports/closure")
    public ResponseEntity<byte[]> performClosure() {
        String today = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);

        // Save daily closure
        FinanceClosure closure = new FinanceClosure(null, today, true, "admin", LocalDateTime.now().toString());
        financeClosureRepository.save(closure);

        List<Transaction> transactions = transactionRepository.findAll();
        List<Transaction> todayTransactions = new ArrayList<>();
        double todayIncome = 0.0;
        double todayExpense = 0.0;

        for (Transaction t : transactions) {
            if (today.equals(t.getDate())) {
                todayTransactions.add(t);
                if ("INCOME".equals(t.getType())) {
                    todayIncome += t.getAmount();
                } else {
                    todayExpense += t.getAmount();
                }
            }
        }

        List<Invoice> invoices = invoiceRepository.findAll();

        try {
            StringWriter writer = new StringWriter();
            writer.append("--- CIERRE DIARIO Y BALANCE FINANCIERO ---\n");
            writer.append("Fecha de Cierre,").append(today).append("\n");
            writer.append("Responsable de Cierre,").append(sanitizeCsvField("admin")).append("\n");
            writer.append("Hora de Registro,").append(LocalDateTime.now().toString()).append("\n\n");

            // Daily balance
            writer.append("=== BALANCE DEL DIA ===\n");
            writer.append("Ingresos de Hoy,Gastos de Hoy,Margen Diario\n");
            writer.append(String.format(Locale.US, "%.2f", todayIncome)).append(",")
                  .append(String.format(Locale.US, "%.2f", todayExpense)).append(",")
                  .append(String.format(Locale.US, "%.2f", todayIncome - todayExpense)).append("\n\n");

            // Today's transaction table
            writer.append("=== TRANSACCIONES DEL DIA ===\n");
            CSVFormat txFormat = CSVFormat.DEFAULT.builder()
                    .setHeader("ID", "Descripcion", "Monto", "Tipo", "Categoria", "Departamento", "Fuga Activa")
                    .build();
            CSVPrinter txPrinter = new CSVPrinter(writer, txFormat);

            for (Transaction t : todayTransactions) {
                txPrinter.printRecord(
                    t.getId(),
                    sanitizeCsvField(t.getDescription()),
                    String.format(Locale.US, "%.2f", t.getAmount()),
                    t.getType(),
                    sanitizeCsvField(t.getCategory()),
                    sanitizeCsvField(t.getDepartment()),
                    t.getIsFuga() ? "SI" : "NO"
                );
            }
            txPrinter.flush();

            // Invoices current status
            writer.append("\n=== ESTADO DE FACTURACION ===\n");
            CSVFormat invFormat = CSVFormat.DEFAULT.builder()
                    .setHeader("Factura ID", "Cliente", "Numero Factura", "Concepto", "Monto Facturado", "Fecha", "Estado", "Departamento")
                    .build();
            CSVPrinter invPrinter = new CSVPrinter(writer, invFormat);

            for (Invoice inv : invoices) {
                invPrinter.printRecord(
                    inv.getId(),
                    sanitizeCsvField(inv.getClientName()),
                    sanitizeCsvField(inv.getInvoiceNumber()),
                    sanitizeCsvField(inv.getConcept()),
                    String.format(Locale.US, "%.2f", inv.getAmount()),
                    inv.getDate(),
                    inv.getStatus(),
                    sanitizeCsvField(inv.getDepartment())
                );
            }
            invPrinter.flush();

            byte[] csvBytes = writer.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);

            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=cierre_financiero_" + today + ".csv");
            headers.set(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8");

            log.info("[AUDIT] Cierre de jornada financiera ejecutado para la fecha: {}", today);

            return new ResponseEntity<>(csvBytes, headers, HttpStatus.OK);

        } catch (IOException e) {
            log.error("[AUDIT] Error generando archivo de cierre CSV: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // --- REPORTS DOWNLOAD (DAILY, WEEKLY, MONTHLY) ---

    @GetMapping("/reports/download")
    public ResponseEntity<byte[]> downloadReport(@RequestParam("type") String type) {
        if (!type.equalsIgnoreCase("DAILY") && !type.equalsIgnoreCase("WEEKLY") && !type.equalsIgnoreCase("MONTHLY")) {
            return ResponseEntity.badRequest().build();
        }

        LocalDate limitDate = LocalDate.now();
        if ("WEEKLY".equalsIgnoreCase(type)) {
            limitDate = LocalDate.now().minusDays(7);
        } else if ("MONTHLY".equalsIgnoreCase(type)) {
            limitDate = LocalDate.now().minusDays(30);
        }

        List<Transaction> transactions = transactionRepository.findAll();
        List<Transaction> filteredTransactions = new ArrayList<>();
        double incomeTotal = 0.0;
        double expenseTotal = 0.0;

        for (Transaction t : transactions) {
            try {
                LocalDate tDate = LocalDate.parse(t.getDate());
                if (!tDate.isBefore(limitDate)) {
                    filteredTransactions.add(t);
                    if ("INCOME".equals(t.getType())) {
                        incomeTotal += t.getAmount();
                    } else {
                        expenseTotal += t.getAmount();
                    }
                }
            } catch (Exception e) {
                // ignore unparseable
            }
        }

        try {
            StringWriter writer = new StringWriter();
            writer.append("--- INFORME FINANCIERO NMN (").append(type.toUpperCase()).append(") ---\n");
            writer.append("Fecha de Exportacion,").append(LocalDate.now().toString()).append("\n");
            writer.append("Total Ingresos,").append(String.format(Locale.US, "%.2f", incomeTotal)).append("\n");
            writer.append("Total Gastos,").append(String.format(Locale.US, "%.2f", expenseTotal)).append("\n");
            writer.append("Balance Neto,").append(String.format(Locale.US, "%.2f", incomeTotal - expenseTotal)).append("\n\n");

            CSVFormat format = CSVFormat.DEFAULT.builder()
                    .setHeader("ID", "Fecha", "Descripcion", "Monto", "Tipo", "Categoria", "Departamento", "Fuga Activa")
                    .build();
            CSVPrinter printer = new CSVPrinter(writer, format);

            for (Transaction t : filteredTransactions) {
                printer.printRecord(
                    t.getId(),
                    t.getDate(),
                    sanitizeCsvField(t.getDescription()),
                    String.format(Locale.US, "%.2f", t.getAmount()),
                    t.getType(),
                    sanitizeCsvField(t.getCategory()),
                    sanitizeCsvField(t.getDepartment()),
                    t.getIsFuga() ? "SI" : "NO"
                );
            }
            printer.flush();

            byte[] csvBytes = writer.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
            String todayStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=informe_financiero_" + type.toLowerCase() + "_" + todayStr + ".csv");
            headers.set(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8");

            log.info("[AUDIT] Informe {} descargado. Transacciones: {}, Balance: {}", 
                    type.toUpperCase(), filteredTransactions.size(), String.format(Locale.US, "%.2f", incomeTotal - expenseTotal));

            return new ResponseEntity<>(csvBytes, headers, HttpStatus.OK);

        } catch (IOException e) {
            log.error("[AUDIT] Error generando informe CSV: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // --- CSV INJECTION ESCAPING HELPER ---
    private String sanitizeCsvField(String val) {
        if (val == null) return "";
        String clean = val.replace("\t", "").replace("\r", "").replace("\n", " ");
        if (clean.startsWith("=") || clean.startsWith("+") || clean.startsWith("-") || clean.startsWith("@")) {
            clean = "'" + clean;
        }
        return clean;
    }

    // --- GLOBAL VALIDATION ERROR HANDLER ---
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> {
            errors.put(error.getField(), error.getDefaultMessage());
        });
        return ResponseEntity.badRequest().body(errors);
    }
}
