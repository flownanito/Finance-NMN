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
public class FinanceClosure {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "La fecha de cierre es obligatoria")
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "La fecha debe tener formato YYYY-MM-DD")
    private String date;

    @NotNull(message = "El estado del cierre es obligatorio")
    private Boolean closed;

    @NotBlank(message = "El usuario de cierre es obligatorio")
    @Size(max = 50, message = "El usuario no puede superar los 50 caracteres")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "El usuario contiene caracteres no permitidos")
    private String closedBy;

    @NotBlank(message = "La marca de tiempo de cierre es obligatoria")
    private String closedAt;
}
