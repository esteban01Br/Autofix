package com.autofix.service;

import com.autofix.dto.request.cita.CitaRequest;
import com.autofix.dto.response.cita.CitaResponse;

import java.util.List;

public interface CitaService {

    CitaResponse crear(CitaRequest request);

    List<CitaResponse> listar();

    CitaResponse buscarPorId(Long id);

    CitaResponse actualizar(Long id, CitaRequest request);

    void eliminar(Long id);

}