package com.autofix.service.impl;

import com.autofix.dto.auth.LoginRequest;
import com.autofix.dto.auth.LoginResponse;
import com.autofix.dto.auth.RegisterRequest;
import com.autofix.entity.Usuario;
import com.autofix.repository.UsuarioRepository;
import com.autofix.security.JwtService;
import com.autofix.service.AuthenticationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationServiceImpl implements AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public LoginResponse login(LoginRequest request) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getCorreo(),
                        request.getContrasena()
                )
        );

        Usuario usuario = usuarioRepository.findByCorreo(request.getCorreo())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String token = jwtService.generateToken(usuario);

        return LoginResponse.builder()
                .token(token)
                .build();
    }

    @Override
    public LoginResponse register(RegisterRequest request) {

        if (usuarioRepository.existsByCorreo(request.getCorreo())) {
            throw new RuntimeException("Ya existe un usuario con ese correo");
        }

        Usuario usuario = Usuario.builder()
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .correo(request.getCorreo())
                .contrasena(passwordEncoder.encode(request.getContrasena()))
                .telefono(request.getTelefono())
                .rol(request.getRol())
                .activo(true)
                .build();

        usuarioRepository.save(usuario);

        String token = jwtService.generateToken(usuario);

        return LoginResponse.builder()
                .token(token)
                .build();
    }
}