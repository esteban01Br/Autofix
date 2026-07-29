package com.autofix.service;

import com.autofix.dto.request.vehiculo.VehiculoRequest;
import com.autofix.dto.response.vehiculo.VehiculoResponse;

import java.util.List;

public interface VehiculoService {

    VehiculoResponse crear(VehiculoRequest request);

    List<VehiculoResponse> listar();

    VehiculoResponse buscarPorId(Long id);

    VehiculoResponse actualizar(Long id, VehiculoRequest request);

    void eliminar(Long id);

}