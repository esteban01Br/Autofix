package com.autofix.service.impl;

import com.autofix.dto.request.mecanico.MecanicoRequest;
import com.autofix.dto.response.mecanico.MecanicoResponse;
import com.autofix.entity.Mecanico;
import com.autofix.entity.Usuario;
import com.autofix.exception.BadRequestException;
import com.autofix.exception.ResourceNotFoundException;
import com.autofix.mapper.MecanicoMapper;
import com.autofix.repository.MecanicoRepository;
import com.autofix.repository.UsuarioRepository;
import com.autofix.service.MecanicoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MecanicoServiceImpl implements MecanicoService {

    private final MecanicoRepository mecanicoRepository;
    private final UsuarioRepository usuarioRepository;
    private final MecanicoMapper mecanicoMapper;

    @Override
    public MecanicoResponse crear(MecanicoRequest request) {

        if (mecanicoRepository.findByUsuarioId(request.getUsuarioId()).isPresent()) {
            throw new BadRequestException("Ese usuario ya está registrado como mecánico.");
        }

        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Usuario no encontrado."));

        Mecanico mecanico = mecanicoMapper.toEntity(request);

        mecanico.setUsuario(usuario);

        Mecanico guardado = mecanicoRepository.save(mecanico);

        return mecanicoMapper.toResponse(guardado);
    }

    @Override
    public List<MecanicoResponse> listar() {

        return mecanicoRepository.findAll()
                .stream()
                .map(mecanicoMapper::toResponse)
                .toList();

    }

    @Override
    public MecanicoResponse buscarPorId(Long id) {

        Mecanico mecanico = mecanicoRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Mecánico no encontrado."));

        return mecanicoMapper.toResponse(mecanico);

    }

    @Override
    public MecanicoResponse actualizar(Long id, MecanicoRequest request) {

        Mecanico mecanico = mecanicoRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Mecánico no encontrado."));

        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Usuario no encontrado."));

        mecanicoRepository.findByUsuarioId(request.getUsuarioId())
                .ifPresent(existente -> {
                    if (!existente.getId().equals(id)) {
                        throw new BadRequestException("Ese usuario ya pertenece a otro mecánico.");
                    }
                });

        mecanicoMapper.updateEntity(request, mecanico);

        mecanico.setUsuario(usuario);

        Mecanico actualizado = mecanicoRepository.save(mecanico);

        return mecanicoMapper.toResponse(actualizado);

    }

    @Override
    public void eliminar(Long id) {

        Mecanico mecanico = mecanicoRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Mecánico no encontrado."));

        mecanicoRepository.delete(mecanico);

    }

}