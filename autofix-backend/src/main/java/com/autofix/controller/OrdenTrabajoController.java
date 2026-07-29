package com.autofix.controller;

import com.autofix.dto.request.orden.OrdenTrabajoRequest;
import com.autofix.dto.response.orden.OrdenTrabajoResponse;
import com.autofix.service.OrdenTrabajoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ordenes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OrdenTrabajoController {

    private final OrdenTrabajoService ordenTrabajoService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrdenTrabajoResponse crear(@Valid @RequestBody OrdenTrabajoRequest request) {

        return ordenTrabajoService.crear(request);

    }

    @GetMapping
    public List<OrdenTrabajoResponse> listar() {

        return ordenTrabajoService.listar();

    }

    @GetMapping("/{id}")
    public OrdenTrabajoResponse buscarPorId(@PathVariable Long id) {

        return ordenTrabajoService.buscarPorId(id);

    }

    @PutMapping("/{id}")
    public OrdenTrabajoResponse actualizar(
            @PathVariable Long id,
            @Valid @RequestBody OrdenTrabajoRequest request) {

        return ordenTrabajoService.actualizar(id, request);

    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {

        ordenTrabajoService.eliminar(id);

    }

}
