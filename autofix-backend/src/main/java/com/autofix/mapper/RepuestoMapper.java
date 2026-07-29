package com.autofix.mapper;

import com.autofix.dto.request.repuesto.RepuestoRequest;
import com.autofix.dto.response.repuesto.RepuestoResponse;
import com.autofix.entity.Repuesto;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.BeanMapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface RepuestoMapper {

    Repuesto toEntity(RepuestoRequest request);

    RepuestoResponse toResponse(Repuesto repuesto);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntityFromRequest(RepuestoRequest request, @MappingTarget Repuesto repuesto);
}