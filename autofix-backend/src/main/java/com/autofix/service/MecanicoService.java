package com.autofix.service;

import com.autofix.dto.request.mecanico.MecanicoRequest;
import com.autofix.dto.response.mecanico.MecanicoResponse;

import java.util.List;

public interface MecanicoService {

    MecanicoResponse crear(MecanicoRequest request);

    List<MecanicoResponse> listar();

    MecanicoResponse buscarPorId(Long id);

    MecanicoResponse actualizar(Long id, MecanicoRequest request);

    void eliminar(Long id);

}