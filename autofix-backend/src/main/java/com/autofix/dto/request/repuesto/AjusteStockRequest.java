// dto/request/repuesto/AjusteStockRequest.java
// Para movimientos de stock (entrada de mercancía), separado del
// descuento automático que hace el Service al crear un DetalleOrden
package com.autofix.dto.request.repuesto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AjusteStockRequest {

    @NotNull(message = "La cantidad es obligatoria")
    private Integer cantidad; // positivo = entrada, negativo = ajuste manual
}