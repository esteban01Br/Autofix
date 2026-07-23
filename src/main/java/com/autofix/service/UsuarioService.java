package com.autofix.service;

import com.autofix.dto.request.usuario.UsuarioRequest;
import com.autofix.dto.response.usuario.UsuarioResponse;

import java.util.List;

public interface UsuarioService {

    UsuarioResponse crear(UsuarioRequest request);

    List<UsuarioResponse> listar();

    UsuarioResponse buscarPorId(Long id);

    UsuarioResponse actualizar(Long id, UsuarioRequest request);

    void eliminar(Long id);
}