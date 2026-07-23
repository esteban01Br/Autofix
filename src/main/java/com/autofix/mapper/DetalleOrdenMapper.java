package com.autofix.mapper;

import com.autofix.dto.request.orden.DetalleOrdenRequest;
import com.autofix.dto.response.orden.DetalleOrdenResponse;
import com.autofix.entity.DetalleOrden;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface DetalleOrdenMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "ordenTrabajo", ignore = true)
    @Mapping(target = "repuesto", ignore = true)
    @Mapping(target = "precioUnitario", ignore = true)
    DetalleOrden toEntity(DetalleOrdenRequest request);

    @Mapping(target = "repuestoId", source = "repuesto.id")
    @Mapping(target = "repuestoNombre", source = "repuesto.nombre")
    @Mapping(target = "subtotalLinea",
            expression = "java(detalle.getPrecioUnitario().multiply(java.math.BigDecimal.valueOf(detalle.getCantidad())))")
    DetalleOrdenResponse toResponse(DetalleOrden detalle);

    List<DetalleOrdenResponse> toResponseList(List<DetalleOrden> detalles);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "ordenTrabajo", ignore = true)
    @Mapping(target = "repuesto", ignore = true)
    @Mapping(target = "precioUnitario", ignore = true)
    void updateEntity(DetalleOrdenRequest request,
                    @MappingTarget DetalleOrden detalle);

}