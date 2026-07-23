package com.autofix.mapper;

import com.autofix.dto.request.usuario.UsuarioRequest;
import com.autofix.dto.response.usuario.UsuarioResponse;
import com.autofix.entity.Usuario;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface UsuarioMapper {

    Usuario toEntity(UsuarioRequest request);

    UsuarioResponse toResponse(Usuario usuario);

    List<UsuarioResponse> toResponseList(List<Usuario> usuarios);

}