package com.autofix.service.impl;

import com.autofix.dto.request.cliente.ClienteRequest;
import com.autofix.dto.response.cliente.ClienteResponse;
import com.autofix.entity.Cliente;
import com.autofix.entity.Usuario;
import com.autofix.exception.BadRequestException;
import com.autofix.exception.ResourceNotFoundException;
import com.autofix.mapper.ClienteMapper;
import com.autofix.repository.ClienteRepository;
import com.autofix.repository.UsuarioRepository;
import com.autofix.service.ClienteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClienteServiceImpl implements ClienteService {

    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final ClienteMapper clienteMapper;

    @Override
    public ClienteResponse crear(ClienteRequest request) {

        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Usuario no encontrado."));

        if (clienteRepository.findByUsuarioId(usuario.getId()).isPresent()) {
            throw new BadRequestException("Ese usuario ya está registrado como cliente.");
        }

        Cliente cliente = clienteMapper.toEntity(request);

        cliente.setUsuario(usuario);

        Cliente guardado = clienteRepository.save(cliente);

        return clienteMapper.toResponse(guardado);
    }

    @Override
    public List<ClienteResponse> listar() {

        return clienteMapper.toResponseList(clienteRepository.findAll());

    }

    @Override
    public ClienteResponse buscarPorId(Long id) {

        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Cliente no encontrado."));

        return clienteMapper.toResponse(cliente);

    }

    @Override
    public ClienteResponse actualizar(Long id, ClienteRequest request) {

        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Cliente no encontrado."));

        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Usuario no encontrado."));

        clienteMapper.updateEntity(request, cliente);

        cliente.setUsuario(usuario);

        Cliente actualizado = clienteRepository.save(cliente);

        return clienteMapper.toResponse(actualizado);

    }

    @Override
    public void eliminar(Long id) {

        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Cliente no encontrado."));

        clienteRepository.delete(cliente);

    }

}