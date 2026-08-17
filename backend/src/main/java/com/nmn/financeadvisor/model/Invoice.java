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
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre del cliente es obligatorio")
    @Size(max = 100, message = "El nombre del cliente no puede superar los 100 caracteres")
    @Pattern(regexp = "^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\\s.,#()\\/+\\-:]+$", message = "El nombre del cliente contiene caracteres no permitidos")
    private String clientName;

    @NotBlank(message = "El número de factura es obligatorio")
    @Size(max = 50, message = "El número de factura no puede superar los 50 caracteres")
    @Pattern(regexp = "^[a-zA-Z0-9-:\\s/]+$", message = "El formato de número de factura es inválido")
    private String invoiceNumber;

    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto de la factura debe ser superior a 0")
    private Double amount;

    @NotBlank(message = "La fecha es obligatoria")
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "La fecha debe tener formato YYYY-MM-DD")
    private String date;

    @NotBlank(message = "El concepto de facturación es obligatorio")
    @Size(max = 150, message = "El concepto no puede superar los 150 caracteres")
    @Pattern(regexp = "^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\\s.,#()\\/+\\-:]+$", message = "El concepto contiene caracteres no permitidos")
    private String concept;

    @NotBlank(message = "El estado es obligatorio")
    @Pattern(regexp = "^(PAID|PENDING)$", message = "El estado debe ser PAID o PENDING")
    private String status;

    @NotBlank(message = "El departamento es obligatorio")
    @Size(max = 50, message = "El departamento no puede superar los 50 caracteres")
    @Pattern(regexp = "^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$", message = "El departamento sólo puede contener letras y espacios")
    private String department;
}
