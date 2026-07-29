package com.autofix.service;

import com.autofix.dto.request.repuesto.RepuestoRequest;
import com.autofix.dto.response.repuesto.RepuestoResponse;

import java.util.List;

public interface RepuestoService {

    RepuestoResponse crear(RepuestoRequest request);

    List<RepuestoResponse> listar();

    RepuestoResponse buscarPorId(Long id);

    RepuestoResponse actualizar(Long id, RepuestoRequest request);

    void eliminar(Long id);

}