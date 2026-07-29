package com.autofix.controller;

import com.autofix.dto.request.cita.CitaRequest;
import com.autofix.dto.response.cita.CitaResponse;
import com.autofix.service.CitaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/citas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CitaController {

    private final CitaService citaService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CitaResponse crear(@Valid @RequestBody CitaRequest request) {

        return citaService.crear(request);

    }

    @GetMapping
    public List<CitaResponse> listar() {

        return citaService.listar();

    }

    @GetMapping("/{id}")
    public CitaResponse buscarPorId(@PathVariable Long id) {

        return citaService.buscarPorId(id);

    }

    @PutMapping("/{id}")
    public CitaResponse actualizar(
            @PathVariable Long id,
            @Valid @RequestBody CitaRequest request) {

        return citaService.actualizar(id, request);

    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {

        citaService.eliminar(id);

    }

}