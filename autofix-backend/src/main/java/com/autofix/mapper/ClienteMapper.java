package com.autofix.mapper;

import com.autofix.dto.request.cliente.ClienteRequest;
import com.autofix.dto.response.cliente.ClienteResponse;
import com.autofix.entity.Cliente;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(
        componentModel = "spring",
        uses = {
                UsuarioMapper.class,
                VehiculoMapper.class
        }
)
public interface ClienteMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "usuario", ignore = true)
    @Mapping(target = "vehiculos", ignore = true)
    Cliente toEntity(ClienteRequest request);

    ClienteResponse toResponse(Cliente cliente);

    List<ClienteResponse> toResponseList(List<Cliente> clientes);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "usuario", ignore = true)
    @Mapping(target = "vehiculos", ignore = true)
    void updateEntity(ClienteRequest request,
                    @MappingTarget Cliente cliente);

}