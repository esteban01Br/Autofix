package com.autofix.dto.response.cliente;

import com.autofix.dto.response.usuario.UsuarioResponse;
import com.autofix.dto.response.vehiculo.VehiculoResponse;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ClienteResponse {

    private Long id;

    private UsuarioResponse usuario;

    private String direccion;

    private List<VehiculoResponse> vehiculos;

}