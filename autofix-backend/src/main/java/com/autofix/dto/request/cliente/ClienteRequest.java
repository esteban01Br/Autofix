// dto/request/cliente/ClienteRequest.java
package com.autofix.dto.request.cliente;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ClienteRequest {

    @NotNull(message = "El usuario es obligatorio")
    private Long usuarioId;

    @Size(max = 200)
    private String direccion;
}
