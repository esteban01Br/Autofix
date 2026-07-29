package com.autofix.mapper;

import com.autofix.dto.request.factura.FacturaRequest;
import com.autofix.dto.response.factura.FacturaResponse;
import com.autofix.entity.Factura;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface FacturaMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "fecha", ignore = true)
    @Mapping(target = "subtotal", ignore = true)
    @Mapping(target = "iva", ignore = true)
    @Mapping(target = "total", ignore = true)
    @Mapping(target = "ordenTrabajo", ignore = true)
    Factura toEntity(FacturaRequest request);

    @Mapping(target = "ordenTrabajoId", source = "ordenTrabajo.id")
    @Mapping(target = "vehiculoPlaca", source = "ordenTrabajo.vehiculo.placa")
    @Mapping(target = "clienteNombre",
            expression = "java(factura.getOrdenTrabajo().getVehiculo().getCliente().getUsuario().getNombre() + \" \" + factura.getOrdenTrabajo().getVehiculo().getCliente().getUsuario().getApellido())")
    FacturaResponse toResponse(Factura factura);

    List<FacturaResponse> toResponseList(List<Factura> facturas);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "fecha", ignore = true)
    @Mapping(target = "subtotal", ignore = true)
    @Mapping(target = "iva", ignore = true)
    @Mapping(target = "total", ignore = true)
    @Mapping(target = "ordenTrabajo", ignore = true)
    void updateEntity(FacturaRequest request,
                    @MappingTarget Factura factura);

}