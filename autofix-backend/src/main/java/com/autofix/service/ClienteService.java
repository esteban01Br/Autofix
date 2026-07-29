package com.autofix.service;

import com.autofix.dto.request.cliente.ClienteRequest;
import com.autofix.dto.response.cliente.ClienteResponse;

import java.util.List;

public interface ClienteService {

    ClienteResponse crear(ClienteRequest request);

    List<ClienteResponse> listar();

    ClienteResponse buscarPorId(Long id);

    ClienteResponse actualizar(Long id, ClienteRequest request);

    void eliminar(Long id);

}