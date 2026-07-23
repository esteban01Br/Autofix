// dto/response/orden/DetalleOrdenResponse.java
package com.autofix.dto.response.orden;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class DetalleOrdenResponse {
    private Long id;
    private Long repuestoId;
    private String repuestoNombre;
    private Integer cantidad;
    private BigDecimal precioUnitario; // tomado de Repuesto al momento de crear
    private BigDecimal subtotalLinea;  // cantidad * precioUnitario
}