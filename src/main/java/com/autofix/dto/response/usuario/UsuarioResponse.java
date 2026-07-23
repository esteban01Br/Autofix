// dto/response/usuario/UsuarioResponse.java
package com.autofix.dto.response.usuario;

import com.autofix.enums.Rol;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UsuarioResponse {
    private Long id;
    private String nombre;
    private String apellido;
    private String correo;
    private String telefono;
    private Rol rol;
    private Boolean activo;
    private LocalDateTime fechaCreacion;
    // Nunca incluir "contrasena" aquí
}