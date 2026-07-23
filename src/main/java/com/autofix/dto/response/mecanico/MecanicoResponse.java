// dto/response/mecanico/MecanicoResponse.java
package com.autofix.dto.response.mecanico;

import com.autofix.dto.response.usuario.UsuarioResponse;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MecanicoResponse {
    private Long id;
    private UsuarioResponse usuario;
    private String especialidad;
}