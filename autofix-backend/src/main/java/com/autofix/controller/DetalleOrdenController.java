package com.autofix.controller;

import com.autofix.dto.request.orden.DetalleOrdenRequest;
import com.autofix.dto.response.orden.DetalleOrdenResponse;
import com.autofix.service.DetalleOrdenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/detalles")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DetalleOrdenController {

    private final DetalleOrdenService detalleService;

    @PostMapping("/orden/{ordenId}")
    @ResponseStatus(HttpStatus.CREATED)
    public DetalleOrdenResponse crear(
            @PathVariable Long ordenId,
            @Valid @RequestBody DetalleOrdenRequest request) {

        return detalleService.crear(ordenId, request);
    }

    @GetMapping
    public List<DetalleOrdenResponse> listar() {
        return detalleService.listar();
    }

    @GetMapping("/{id}")
    public DetalleOrdenResponse buscarPorId(@PathVariable Long id) {
        return detalleService.buscarPorId(id);
    }

    @GetMapping("/orden/{ordenId}")
    public List<DetalleOrdenResponse> listarPorOrden(
            @PathVariable Long ordenId) {

        return detalleService.listarPorOrden(ordenId);
    }

    @PutMapping("/{id}")
    public DetalleOrdenResponse actualizar(
            @PathVariable Long id,
            @Valid @RequestBody DetalleOrdenRequest request) {

        return detalleService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        detalleService.eliminar(id);
    }
}