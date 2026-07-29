// dto/response/vehiculo/VehiculoResponse.java
package com.autofix.dto.response.vehiculo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VehiculoResponse {
    private Long id;
    private String placa;
    private String marca;
    private String modelo;
    private Integer anio;
    private String color;
    private Integer kilometraje;
    private Long clienteId;
    private String clienteNombre; // nombre + apellido del cliente, aplanado
}