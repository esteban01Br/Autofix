// mapper/VehiculoMapper.java
package com.autofix.mapper;

import com.autofix.dto.request.vehiculo.VehiculoRequest;
import com.autofix.dto.response.vehiculo.VehiculoResponse;
import com.autofix.dto.response.vehiculo.VehiculoResumen;
import com.autofix.entity.Vehiculo;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface VehiculoMapper {

    // clienteId viene del request; el Service se encarga de buscar
    // el Cliente por ese id y asignarlo — el mapper no toca relaciones
    @Mapping(target = "cliente", ignore = true)
    Vehiculo toEntity(VehiculoRequest request);

    @Mapping(source = "cliente.id", target = "clienteId")
    @Mapping(target = "clienteNombre", expression =
        "java(vehiculo.getCliente().getUsuario().getNombre() + \" \" + vehiculo.getCliente().getUsuario().getApellido())")
    VehiculoResponse toResponse(Vehiculo vehiculo);

    // Versión ligera para usar dentro de ClienteResponse
    VehiculoResumen toResumen(Vehiculo vehiculo);

    @Mapping(target = "cliente", ignore = true)
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntityFromRequest(VehiculoRequest request, @MappingTarget Vehiculo vehiculo);
}