// dto/request/orden/OrdenTrabajoRequest.java
// Creación: no pide estado (arranca en RECIBIDO por defecto en la entidad)
package com.autofix.dto.request.orden;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class OrdenTrabajoRequest {

    @NotNull(message = "El vehículo es obligatorio")
    private Long vehiculoId;

    private Long mecanicoId; // opcional: puede asignarse después

    @Size(max = 1000)
    private String diagnostico;

    @Size(max = 1000)
    private String observaciones;
}