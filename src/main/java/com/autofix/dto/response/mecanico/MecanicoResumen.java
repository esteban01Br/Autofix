// dto/response/mecanico/MecanicoResumen.java
// Para usar dentro de OrdenTrabajoResponse sin recursión
package com.autofix.dto.response.mecanico;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MecanicoResumen {
    private Long id;
    private String nombreCompleto;
    private String especialidad;
}