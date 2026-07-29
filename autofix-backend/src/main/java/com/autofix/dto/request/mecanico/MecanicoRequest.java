// dto/request/mecanico/MecanicoRequest.java
package com.autofix.dto.request.mecanico;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class MecanicoRequest {

    @NotNull(message = "El usuario es obligatorio")
    private Long usuarioId;

    @Size(max = 100)
    private String especialidad;
}