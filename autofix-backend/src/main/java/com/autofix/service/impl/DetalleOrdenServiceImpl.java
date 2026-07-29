package com.autofix.service.impl;

import com.autofix.dto.request.orden.DetalleOrdenRequest;
import com.autofix.dto.response.orden.DetalleOrdenResponse;
import com.autofix.entity.DetalleOrden;
import com.autofix.entity.OrdenTrabajo;
import com.autofix.entity.Repuesto;
import com.autofix.exception.BadRequestException;
import com.autofix.exception.ResourceNotFoundException;
import com.autofix.mapper.DetalleOrdenMapper;
import com.autofix.repository.DetalleOrdenRepository;
import com.autofix.repository.OrdenTrabajoRepository;
import com.autofix.repository.RepuestoRepository;
import com.autofix.service.DetalleOrdenService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DetalleOrdenServiceImpl implements DetalleOrdenService {

    private final DetalleOrdenRepository detalleRepository;
    private final OrdenTrabajoRepository ordenRepository;
    private final RepuestoRepository repuestoRepository;
    private final DetalleOrdenMapper detalleMapper;

    @Override
    public DetalleOrdenResponse crear(Long ordenId, DetalleOrdenRequest request) {

        OrdenTrabajo orden = ordenRepository.findById(ordenId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Orden no encontrada."));

        Repuesto repuesto = repuestoRepository.findById(request.getRepuestoId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Repuesto no encontrado."));

        if (repuesto.getStock() < request.getCantidad()) {
            throw new BadRequestException("Stock insuficiente.");
        }

        DetalleOrden detalle = detalleMapper.toEntity(request);

        detalle.setOrdenTrabajo(orden);
        detalle.setRepuesto(repuesto);
        detalle.setPrecioUnitario(repuesto.getPrecio());

        repuesto.setStock(repuesto.getStock() - request.getCantidad());
        repuestoRepository.save(repuesto);

        return detalleMapper.toResponse(detalleRepository.save(detalle));
    }

    @Override
    public List<DetalleOrdenResponse> listar() {
        return detalleMapper.toResponseList(detalleRepository.findAll());
    }

    @Override
    public DetalleOrdenResponse buscarPorId(Long id) {

        DetalleOrden detalle = detalleRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Detalle no encontrado."));

        return detalleMapper.toResponse(detalle);
    }

    @Override
    public List<DetalleOrdenResponse> listarPorOrden(Long ordenId) {
        return detalleMapper.toResponseList(
                detalleRepository.findByOrdenTrabajoId(ordenId));
    }

    @Override
    public DetalleOrdenResponse actualizar(Long id,
                                           DetalleOrdenRequest request) {

        DetalleOrden detalle = detalleRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Detalle no encontrado."));

        Repuesto repuesto = repuestoRepository.findById(request.getRepuestoId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Repuesto no encontrado."));

        detalleMapper.updateEntity(request, detalle);

        detalle.setRepuesto(repuesto);
        detalle.setPrecioUnitario(repuesto.getPrecio());

        return detalleMapper.toResponse(
                detalleRepository.save(detalle));
    }

    @Override
    public void eliminar(Long id) {

        DetalleOrden detalle = detalleRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Detalle no encontrado."));

        Repuesto repuesto = detalle.getRepuesto();

        repuesto.setStock(
                repuesto.getStock() + detalle.getCantidad());

        repuestoRepository.save(repuesto);

        detalleRepository.delete(detalle);
    }
}