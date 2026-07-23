// dto/request/orden/AsignarMecanicoRequest.java
package com.autofix.dto.request.orden;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AsignarMecanicoRequest {

    @NotNull(message = "El mecánico es obligatorio")
    private Long mecanicoId;
}