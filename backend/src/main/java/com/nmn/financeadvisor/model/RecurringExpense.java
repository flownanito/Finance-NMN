package com.nmn.financeadvisor.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecurringExpense {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "La descripción es obligatoria")
    @Size(max = 100)
    private String description;

    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "0.01")
    private Double amount;

    @NotBlank(message = "La categoría es obligatoria")
    private String category;

    @NotBlank(message = "El departamento es obligatorio")
    private String department;

    @NotBlank(message = "La frecuencia es obligatoria")
    @Pattern(regexp = "^(MONTHLY|WEEKLY|YEARLY)$")
    private String frequency;

    // Día de ejecución (1-31 para MONTHLY, 1-7 para WEEKLY, 1-365 para YEARLY)
    @NotNull(message = "El día de ejecución es obligatorio")
    private Integer executionDay;

    // Formato YYYY-MM-DD para saber cuándo se ejecutará la próxima vez
    private String nextExecutionDate;

    private Boolean isActive = true;
}
