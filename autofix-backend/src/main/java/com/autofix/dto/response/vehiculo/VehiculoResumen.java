// dto/response/vehiculo/VehiculoResumen.java
// Versión ligera para usar dentro de ClienteResponse (evita el ciclo)
package com.autofix.dto.response.vehiculo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VehiculoResumen {
    private Long id;
    private String placa;
    private String marca;
    private String modelo;
}