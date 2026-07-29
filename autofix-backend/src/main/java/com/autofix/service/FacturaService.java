package com.autofix.service;

import com.autofix.dto.request.factura.FacturaRequest;
import com.autofix.dto.response.factura.FacturaResponse;

import java.util.List;

public interface FacturaService {

    FacturaResponse crear(FacturaRequest request);

    List<FacturaResponse> listar();

    FacturaResponse buscarPorId(Long id);

    void eliminar(Long id);
}