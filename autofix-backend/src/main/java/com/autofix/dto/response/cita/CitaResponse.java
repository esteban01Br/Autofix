// dto/response/cita/CitaResponse.java
package com.autofix.dto.response.cita;

import com.autofix.enums.EstadoCita;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
public class CitaResponse {
    private Long id;
    private LocalDate fecha;
    private LocalTime hora;
    private EstadoCita estado;
    private String descripcion;
    private Long vehiculoId;
    private String vehiculoPlaca;
    private String clienteNombre; // dueño del vehículo, útil para el mecánico/admin
}