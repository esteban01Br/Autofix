// dto/request/usuario/UsuarioRequest.java
package com.autofix.dto.request.usuario;

import com.autofix.enums.Rol;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UsuarioRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100)
    private String nombre;

    @NotBlank(message = "El apellido es obligatorio")
    @Size(max = 100)
    private String apellido;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El correo no tiene un formato válido")
    @Size(max = 150)
    private String correo;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    private String contrasena;

    @Size(max = 20)
    private String telefono;

    @NotNull(message = "El rol es obligatorio")
    private Rol rol;
}