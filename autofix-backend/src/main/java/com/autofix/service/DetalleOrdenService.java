package com.autofix.service;

import com.autofix.dto.request.orden.DetalleOrdenRequest;
import com.autofix.dto.response.orden.DetalleOrdenResponse;

import java.util.List;

public interface DetalleOrdenService {

    DetalleOrdenResponse crear(Long ordenId, DetalleOrdenRequest request);

    List<DetalleOrdenResponse> listar();

    DetalleOrdenResponse buscarPorId(Long id);

    List<DetalleOrdenResponse> listarPorOrden(Long ordenId);

    DetalleOrdenResponse actualizar(Long id, DetalleOrdenRequest request);

    void eliminar(Long id);
}
