// dto/request/orden/DetalleOrdenRequest.java
// Nota: va dentro de OrdenTrabajoRequest o como sub-recurso,
// según cómo decidamos el endpoint (lo definimos en Controllers)
package com.autofix.dto.request.orden;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DetalleOrdenRequest {

    @NotNull(message = "El repuesto es obligatorio")
    private Long repuestoId;

    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad debe ser al menos 1")
    private Integer cantidad;
}