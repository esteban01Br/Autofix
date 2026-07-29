package com.autofix.controller;

import com.autofix.dto.request.vehiculo.VehiculoRequest;
import com.autofix.dto.response.vehiculo.VehiculoResponse;
import com.autofix.service.VehiculoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehiculos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class VehiculoController {

    private final VehiculoService vehiculoService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VehiculoResponse crear(@Valid @RequestBody VehiculoRequest request) {

        return vehiculoService.crear(request);

    }

    @GetMapping
    public List<VehiculoResponse> listar() {

        return vehiculoService.listar();

    }

    @GetMapping("/{id}")
    public VehiculoResponse buscarPorId(@PathVariable Long id) {

        return vehiculoService.buscarPorId(id);

    }

    @PutMapping("/{id}")
    public VehiculoResponse actualizar(
            @PathVariable Long id,
            @Valid @RequestBody VehiculoRequest request) {

        return vehiculoService.actualizar(id, request);

    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {

        vehiculoService.eliminar(id);

    }

}