// dto/response/repuesto/RepuestoResponse.java
package com.autofix.dto.response.repuesto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class RepuestoResponse {
    private Long id;
    private String nombre;
    private String descripcion;
    private Integer stock;
    private BigDecimal precio;
}