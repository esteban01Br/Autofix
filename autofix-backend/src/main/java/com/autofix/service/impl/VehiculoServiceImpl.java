package com.autofix.service.impl;

import com.autofix.dto.request.vehiculo.VehiculoRequest;
import com.autofix.dto.response.vehiculo.VehiculoResponse;
import com.autofix.entity.Cliente;
import com.autofix.entity.Vehiculo;
import com.autofix.exception.BadRequestException;
import com.autofix.exception.ResourceNotFoundException;
import com.autofix.mapper.VehiculoMapper;
import com.autofix.repository.ClienteRepository;
import com.autofix.repository.VehiculoRepository;
import com.autofix.service.VehiculoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VehiculoServiceImpl implements VehiculoService {

    private final VehiculoRepository vehiculoRepository;
    private final ClienteRepository clienteRepository;
    private final VehiculoMapper vehiculoMapper;

    @Override
    public VehiculoResponse crear(VehiculoRequest request) {

        if (vehiculoRepository.existsByPlaca(request.getPlaca())) {
            throw new BadRequestException("La placa ya está registrada.");
        }

        Cliente cliente = clienteRepository.findById(request.getClienteId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Cliente no encontrado."));

        Vehiculo vehiculo = vehiculoMapper.toEntity(request);

        vehiculo.setCliente(cliente);

        Vehiculo guardado = vehiculoRepository.save(vehiculo);

        return vehiculoMapper.toResponse(guardado);
    }

    @Override
    public List<VehiculoResponse> listar() {

        return vehiculoRepository.findAll()
                .stream()
                .map(vehiculoMapper::toResponse)
                .toList();

    }

    @Override
    public VehiculoResponse buscarPorId(Long id) {

        Vehiculo vehiculo = vehiculoRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Vehículo no encontrado."));

        return vehiculoMapper.toResponse(vehiculo);

    }

    @Override
    public VehiculoResponse actualizar(Long id, VehiculoRequest request) {

        Vehiculo vehiculo = vehiculoRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Vehículo no encontrado."));

        if (!vehiculo.getPlaca().equals(request.getPlaca())
                && vehiculoRepository.existsByPlaca(request.getPlaca())) {

            throw new BadRequestException("La placa ya está registrada.");
        }

        Cliente cliente = clienteRepository.findById(request.getClienteId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Cliente no encontrado."));

        vehiculoMapper.updateEntityFromRequest(request, vehiculo);

        vehiculo.setCliente(cliente);

        Vehiculo actualizado = vehiculoRepository.save(vehiculo);

        return vehiculoMapper.toResponse(actualizado);

    }

    @Override
    public void eliminar(Long id) {

        Vehiculo vehiculo = vehiculoRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Vehículo no encontrado."));

        vehiculoRepository.delete(vehiculo);

    }

}