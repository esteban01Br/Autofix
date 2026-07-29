// dto/response/factura/FacturaResponse.java
package com.autofix.dto.response.factura;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class FacturaResponse {
    private Long id;
    private LocalDateTime fecha;
    private BigDecimal subtotal;
    private BigDecimal iva;
    private BigDecimal total;
    private Long ordenTrabajoId;
    private String vehiculoPlaca;
    private String clienteNombre;
}