// dto/request/cita/CitaEstadoRequest.java
// Request separado para cambiar solo el estado (PATCH) — no debería
// permitirse cambiar fecha/vehículo en la misma operación
package com.autofix.dto.request.cita;

import com.autofix.enums.EstadoCita;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CitaEstadoRequest {

    @NotNull(message = "El estado es obligatorio")
    private EstadoCita estado;
}