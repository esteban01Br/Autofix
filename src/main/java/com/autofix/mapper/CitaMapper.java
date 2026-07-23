package com.autofix.mapper;

import com.autofix.dto.request.cita.CitaRequest;
import com.autofix.dto.response.cita.CitaResponse;
import com.autofix.entity.Cita;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CitaMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "estado", ignore = true)
    @Mapping(target = "vehiculo", ignore = true)
    Cita toEntity(CitaRequest request);

    @Mapping(target = "vehiculoId", source = "vehiculo.id")
    @Mapping(target = "vehiculoPlaca", source = "vehiculo.placa")
    @Mapping(target = "clienteNombre",
            expression = "java(cita.getVehiculo().getCliente().getUsuario().getNombre() + \" \" + cita.getVehiculo().getCliente().getUsuario().getApellido())")
    CitaResponse toResponse(Cita cita);

    List<CitaResponse> toResponseList(List<Cita> citas);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "estado", ignore = true)
    @Mapping(target = "vehiculo", ignore = true)
    void updateEntity(CitaRequest request,
                    @MappingTarget Cita cita);

}