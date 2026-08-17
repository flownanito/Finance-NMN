package com.nmn.financeadvisor.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BankAccount {
    @Id
    private Long id; // Siempre será 1 para la cuenta global única
    
    private Double balance;
    
    private String lastUpdated;
}
