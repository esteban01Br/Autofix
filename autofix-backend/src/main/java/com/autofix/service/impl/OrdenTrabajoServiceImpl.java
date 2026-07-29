package com.autofix.service.impl;

import com.autofix.dto.request.orden.OrdenTrabajoRequest;
import com.autofix.dto.response.orden.OrdenTrabajoResponse;
import com.autofix.entity.Mecanico;
import com.autofix.entity.OrdenTrabajo;
import com.autofix.entity.Vehiculo;
import com.autofix.exception.ResourceNotFoundException;
import com.autofix.mapper.OrdenTrabajoMapper;
import com.autofix.repository.MecanicoRepository;
import com.autofix.repository.OrdenTrabajoRepository;
import com.autofix.repository.VehiculoRepository;
import com.autofix.service.OrdenTrabajoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrdenTrabajoServiceImpl implements OrdenTrabajoService {

    private final OrdenTrabajoRepository ordenTrabajoRepository;
    private final VehiculoRepository vehiculoRepository;
    private final MecanicoRepository mecanicoRepository;
    private final OrdenTrabajoMapper ordenTrabajoMapper;

    @Override
    public OrdenTrabajoResponse crear(OrdenTrabajoRequest request) {

        Vehiculo vehiculo = vehiculoRepository.findById(request.getVehiculoId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Vehículo no encontrado."));

        OrdenTrabajo orden = ordenTrabajoMapper.toEntity(request);

        orden.setVehiculo(vehiculo);

        if (request.getMecanicoId() != null) {

            Mecanico mecanico = mecanicoRepository.findById(request.getMecanicoId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Mecánico no encontrado."));

            orden.setMecanico(mecanico);
        }

        OrdenTrabajo guardada = ordenTrabajoRepository.save(orden);

        return ordenTrabajoMapper.toResponse(guardada);
    }

    @Override
    public List<OrdenTrabajoResponse> listar() {

        return ordenTrabajoRepository.findAll()
                .stream()
                .map(ordenTrabajoMapper::toResponse)
                .toList();

    }

    @Override
    public OrdenTrabajoResponse buscarPorId(Long id) {

        OrdenTrabajo orden = ordenTrabajoRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Orden de trabajo no encontrada."));

        return ordenTrabajoMapper.toResponse(orden);

    }

    @Override
    public OrdenTrabajoResponse actualizar(Long id, OrdenTrabajoRequest request) {

        OrdenTrabajo orden = ordenTrabajoRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Orden de trabajo no encontrada."));

        Vehiculo vehiculo = vehiculoRepository.findById(request.getVehiculoId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Vehículo no encontrado."));

        ordenTrabajoMapper.updateEntity(request, orden);

        orden.setVehiculo(vehiculo);

        if (request.getMecanicoId() != null) {

            Mecanico mecanico = mecanicoRepository.findById(request.getMecanicoId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Mecánico no encontrado."));

            orden.setMecanico(mecanico);

        } else {

            orden.setMecanico(null);

        }

        OrdenTrabajo actualizada = ordenTrabajoRepository.save(orden);

        return ordenTrabajoMapper.toResponse(actualizada);

    }

    @Override
    public void eliminar(Long id) {

        OrdenTrabajo orden = ordenTrabajoRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Orden de trabajo no encontrada."));

        ordenTrabajoRepository.delete(orden);

    }

}