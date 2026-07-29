package com.autofix.service;

import com.autofix.dto.request.orden.OrdenTrabajoRequest;
import com.autofix.dto.response.orden.OrdenTrabajoResponse;

import java.util.List;

public interface OrdenTrabajoService {

    OrdenTrabajoResponse crear(OrdenTrabajoRequest request);

    List<OrdenTrabajoResponse> listar();

    OrdenTrabajoResponse buscarPorId(Long id);

    OrdenTrabajoResponse actualizar(Long id, OrdenTrabajoRequest request);

    void eliminar(Long id);

}