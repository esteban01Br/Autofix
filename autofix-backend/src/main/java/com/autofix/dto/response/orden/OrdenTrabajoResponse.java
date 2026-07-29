package com.autofix.dto.response.orden;

import com.autofix.dto.response.mecanico.MecanicoResponse;
import com.autofix.enums.EstadoOrden;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class OrdenTrabajoResponse {

    private Long id;

    private LocalDateTime fechaIngreso;

    private LocalDateTime fechaSalida;

    private EstadoOrden estado;

    private String diagnostico;

    private String observaciones;

    private MecanicoResponse mecanico;

    private Long vehiculoId;

    private String vehiculoPlaca;

    private List<DetalleOrdenResponse> detalles;

    private Boolean tieneFactura;

}