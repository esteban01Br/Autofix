package com.autofix.controller;

import com.autofix.dto.request.factura.FacturaRequest;
import com.autofix.dto.response.factura.FacturaResponse;
import com.autofix.service.FacturaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/facturas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FacturaController {

    private final FacturaService facturaService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FacturaResponse crear(@Valid @RequestBody FacturaRequest request) {
        return facturaService.crear(request);
    }

    @GetMapping
    public List<FacturaResponse> listar() {
        return facturaService.listar();
    }

    @GetMapping("/{id}")
    public FacturaResponse buscarPorId(@PathVariable Long id) {
        return facturaService.buscarPorId(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        facturaService.eliminar(id);
    }
}