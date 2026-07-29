// dto/request/orden/OrdenTrabajoEstadoRequest.java
package com.autofix.dto.request.orden;

import com.autofix.enums.EstadoOrden;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrdenTrabajoEstadoRequest {

    @NotNull(message = "El estado es obligatorio")
    private EstadoOrden estado;
}