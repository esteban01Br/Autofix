// dto/request/factura/FacturaRequest.java
// La factura se genera automáticamente desde el Service (a partir de
// los detalles de la orden), así que el request solo necesita el ID de la orden
package com.autofix.dto.request.factura;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FacturaRequest {

    @NotNull(message = "La orden de trabajo es obligatoria")
    private Long ordenTrabajoId;
}