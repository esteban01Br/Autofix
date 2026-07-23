package com.autofix.mapper;

import com.autofix.dto.request.mecanico.MecanicoRequest;
import com.autofix.dto.response.mecanico.MecanicoResponse;
import com.autofix.entity.Mecanico;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(
        componentModel = "spring",
        uses = {
                UsuarioMapper.class
        }
)
public interface MecanicoMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "usuario", ignore = true)
    @Mapping(target = "ordenes", ignore = true)
    Mecanico toEntity(MecanicoRequest request);

    MecanicoResponse toResponse(Mecanico mecanico);

    List<MecanicoResponse> toResponseList(List<Mecanico> mecanicos);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "usuario", ignore = true)
    @Mapping(target = "ordenes", ignore = true)
    void updateEntity(MecanicoRequest request,
    @MappingTarget Mecanico mecanico);
}