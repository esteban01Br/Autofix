package com.autofix.controller;

import com.autofix.dto.request.repuesto.RepuestoRequest;
import com.autofix.dto.response.repuesto.RepuestoResponse;
import com.autofix.service.RepuestoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repuestos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RepuestoController {

    private final RepuestoService repuestoService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RepuestoResponse crear(@Valid @RequestBody RepuestoRequest request) {

        return repuestoService.crear(request);

    }

    @GetMapping
    public List<RepuestoResponse> listar() {

        return repuestoService.listar();

    }

    @GetMapping("/{id}")
    public RepuestoResponse buscarPorId(@PathVariable Long id) {

        return repuestoService.buscarPorId(id);

    }

    @PutMapping("/{id}")
    public RepuestoResponse actualizar(
            @PathVariable Long id,
            @Valid @RequestBody RepuestoRequest request) {

        return repuestoService.actualizar(id, request);

    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {

        repuestoService.eliminar(id);

    }

}