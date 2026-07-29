package com.autofix.service.impl;

import com.autofix.dto.request.factura.FacturaRequest;
import com.autofix.dto.response.factura.FacturaResponse;
import com.autofix.entity.DetalleOrden;
import com.autofix.entity.Factura;
import com.autofix.entity.OrdenTrabajo;
import com.autofix.exception.BadRequestException;
import com.autofix.exception.ResourceNotFoundException;
import com.autofix.mapper.FacturaMapper;
import com.autofix.repository.FacturaRepository;
import com.autofix.repository.OrdenTrabajoRepository;
import com.autofix.service.FacturaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FacturaServiceImpl implements FacturaService {

    private final FacturaRepository facturaRepository;
    private final OrdenTrabajoRepository ordenTrabajoRepository;
    private final FacturaMapper facturaMapper;

    @Override
    public FacturaResponse crear(FacturaRequest request) {

        if (facturaRepository.findByOrdenTrabajoId(request.getOrdenTrabajoId()).isPresent()) {
            throw new BadRequestException("La orden ya tiene una factura.");
        }

        OrdenTrabajo orden = ordenTrabajoRepository.findById(request.getOrdenTrabajoId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Orden de trabajo no encontrada."));

        BigDecimal subtotal = BigDecimal.ZERO;

        for (DetalleOrden detalle : orden.getDetalles()) {

            BigDecimal linea = detalle.getPrecioUnitario()
                    .multiply(BigDecimal.valueOf(detalle.getCantidad()));

            subtotal = subtotal.add(linea);
        }

        BigDecimal iva = subtotal.multiply(new BigDecimal("0.19"));
        BigDecimal total = subtotal.add(iva);

        Factura factura = facturaMapper.toEntity(request);

        factura.setOrdenTrabajo(orden);
        factura.setSubtotal(subtotal);
        factura.setIva(iva);
        factura.setTotal(total);

        return facturaMapper.toResponse(facturaRepository.save(factura));
    }

    @Override
    public List<FacturaResponse> listar() {
        return facturaMapper.toResponseList(facturaRepository.findAll());
    }

    @Override
    public FacturaResponse buscarPorId(Long id) {

        Factura factura = facturaRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Factura no encontrada."));

        return facturaMapper.toResponse(factura);
    }

    @Override
    public void eliminar(Long id) {

        Factura factura = facturaRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Factura no encontrada."));

        facturaRepository.delete(factura);
    }
}