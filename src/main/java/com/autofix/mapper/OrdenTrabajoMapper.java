package com.autofix.mapper;

import com.autofix.dto.request.orden.OrdenTrabajoRequest;
import com.autofix.dto.response.orden.OrdenTrabajoResponse;
import com.autofix.entity.OrdenTrabajo;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(
        componentModel = "spring",
        uses = {
                MecanicoMapper.class,
                DetalleOrdenMapper.class
        }
)
public interface OrdenTrabajoMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "fechaIngreso", ignore = true)
    @Mapping(target = "fechaSalida", ignore = true)
    @Mapping(target = "estado", ignore = true)
    @Mapping(target = "vehiculo", ignore = true)
    @Mapping(target = "mecanico", ignore = true)
    @Mapping(target = "detalles", ignore = true)
    @Mapping(target = "factura", ignore = true)
    OrdenTrabajo toEntity(OrdenTrabajoRequest request);

    @Mapping(target = "vehiculoId", source = "vehiculo.id")
    @Mapping(target = "vehiculoPlaca", source = "vehiculo.placa")
    @Mapping(target = "tieneFactura", expression = "java(orden.getFactura() != null)")
    OrdenTrabajoResponse toResponse(OrdenTrabajo orden);

    List<OrdenTrabajoResponse> toResponseList(List<OrdenTrabajo> ordenes);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "fechaIngreso", ignore = true)
    @Mapping(target = "fechaSalida", ignore = true)
    @Mapping(target = "estado", ignore = true)
    @Mapping(target = "vehiculo", ignore = true)
    @Mapping(target = "mecanico", ignore = true)
    @Mapping(target = "detalles", ignore = true)
    @Mapping(target = "factura", ignore = true)
    void updateEntity(OrdenTrabajoRequest request,
                    @MappingTarget OrdenTrabajo orden);

}