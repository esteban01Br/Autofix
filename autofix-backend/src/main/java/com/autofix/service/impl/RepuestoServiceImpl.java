package com.autofix.service.impl;

import com.autofix.dto.request.repuesto.RepuestoRequest;
import com.autofix.dto.response.repuesto.RepuestoResponse;
import com.autofix.entity.Repuesto;
import com.autofix.exception.BadRequestException;
import com.autofix.exception.ResourceNotFoundException;
import com.autofix.mapper.RepuestoMapper;
import com.autofix.repository.RepuestoRepository;
import com.autofix.service.RepuestoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RepuestoServiceImpl implements RepuestoService {

    private final RepuestoRepository repuestoRepository;
    private final RepuestoMapper repuestoMapper;

    @Override
    public RepuestoResponse crear(RepuestoRequest request) {

        if (repuestoRepository.existsByNombreIgnoreCase(request.getNombre())) {
            throw new BadRequestException("Ya existe un repuesto con ese nombre.");
        }

        Repuesto repuesto = repuestoMapper.toEntity(request);

        Repuesto guardado = repuestoRepository.save(repuesto);

        return repuestoMapper.toResponse(guardado);
    }

    @Override
    public List<RepuestoResponse> listar() {

        return repuestoRepository.findAll()
                .stream()
                .map(repuestoMapper::toResponse)
                .toList();

    }

    @Override
    public RepuestoResponse buscarPorId(Long id) {

        Repuesto repuesto = repuestoRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Repuesto no encontrado."));

        return repuestoMapper.toResponse(repuesto);

    }

    @Override
    public RepuestoResponse actualizar(Long id, RepuestoRequest request) {

        Repuesto repuesto = repuestoRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Repuesto no encontrado."));

        if (!repuesto.getNombre().equalsIgnoreCase(request.getNombre())
                && repuestoRepository.existsByNombreIgnoreCase(request.getNombre())) {

            throw new BadRequestException("Ya existe un repuesto con ese nombre.");
        }

        repuestoMapper.updateEntityFromRequest(request, repuesto);

        Repuesto actualizado = repuestoRepository.save(repuesto);

        return repuestoMapper.toResponse(actualizado);

    }

    @Override
    public void eliminar(Long id) {

        Repuesto repuesto = repuestoRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Repuesto no encontrado."));

        repuestoRepository.delete(repuesto);

    }

}
