// dto/request/vehiculo/VehiculoRequest.java
package com.autofix.dto.request.vehiculo;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class VehiculoRequest {

    @NotBlank(message = "La placa es obligatoria")
    @Size(max = 10)
    private String placa;

    @NotBlank(message = "La marca es obligatoria")
    @Size(max = 50)
    private String marca;

    @NotBlank(message = "El modelo es obligatorio")
    @Size(max = 50)
    private String modelo;

    @Min(value = 1950, message = "Año inválido")
    private Integer anio;

    @Size(max = 30)
    private String color;

    @PositiveOrZero(message = "El kilometraje no puede ser negativo")
    private Integer kilometraje;

    @NotNull(message = "El cliente es obligatorio")
    private Long clienteId;
}