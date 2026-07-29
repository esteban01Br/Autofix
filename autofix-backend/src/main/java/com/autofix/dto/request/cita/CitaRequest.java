// dto/request/cita/CitaRequest.java
package com.autofix.dto.request.cita;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class CitaRequest {

    @NotNull(message = "La fecha es obligatoria")
    @FutureOrPresent(message = "La fecha no puede ser en el pasado")
    private LocalDate fecha;

    @NotNull(message = "La hora es obligatoria")
    private LocalTime hora;

    @Size(max = 500)
    private String descripcion;

    @NotNull(message = "El vehículo es obligatorio")
    private Long vehiculoId;
}