package com.autofix.service.impl;

import com.autofix.dto.request.cita.CitaRequest;
import com.autofix.dto.response.cita.CitaResponse;
import com.autofix.entity.Cita;
import com.autofix.entity.Vehiculo;
import com.autofix.exception.ResourceNotFoundException;
import com.autofix.mapper.CitaMapper;
import com.autofix.repository.CitaRepository;
import com.autofix.repository.VehiculoRepository;
import com.autofix.service.CitaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CitaServiceImpl implements CitaService {

    private final CitaRepository citaRepository;
    private final VehiculoRepository vehiculoRepository;
    private final CitaMapper citaMapper;

    @Override
    public CitaResponse crear(CitaRequest request) {

        Vehiculo vehiculo = vehiculoRepository.findById(request.getVehiculoId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Vehículo no encontrado."));

        Cita cita = citaMapper.toEntity(request);

        cita.setVehiculo(vehiculo);

        Cita guardada = citaRepository.save(cita);

        return citaMapper.toResponse(guardada);
    }

    @Override
    public List<CitaResponse> listar() {

        return citaRepository.findAll()
                .stream()
                .map(citaMapper::toResponse)
                .toList();

    }

    @Override
    public CitaResponse buscarPorId(Long id) {

        Cita cita = citaRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Cita no encontrada."));

        return citaMapper.toResponse(cita);

    }

    @Override
    public CitaResponse actualizar(Long id, CitaRequest request) {

        Cita cita = citaRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Cita no encontrada."));

        Vehiculo vehiculo = vehiculoRepository.findById(request.getVehiculoId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Vehículo no encontrado."));

        citaMapper.updateEntity(request, cita);

        cita.setVehiculo(vehiculo);

        Cita actualizada = citaRepository.save(cita);

        return citaMapper.toResponse(actualizada);
    }

    @Override
    public void eliminar(Long id) {

        Cita cita = citaRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Cita no encontrada."));

        citaRepository.delete(cita);

    }

}