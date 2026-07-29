package com.autofix.controller;

import com.autofix.dto.request.mecanico.MecanicoRequest;
import com.autofix.dto.response.mecanico.MecanicoResponse;
import com.autofix.service.MecanicoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mecanicos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MecanicoController {

    private final MecanicoService mecanicoService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MecanicoResponse crear(@Valid @RequestBody MecanicoRequest request) {

        return mecanicoService.crear(request);

    }

    @GetMapping
    public List<MecanicoResponse> listar() {

        return mecanicoService.listar();

    }

    @GetMapping("/{id}")
    public MecanicoResponse buscarPorId(@PathVariable Long id) {

        return mecanicoService.buscarPorId(id);

    }

    @PutMapping("/{id}")
    public MecanicoResponse actualizar(
            @PathVariable Long id,
            @Valid @RequestBody MecanicoRequest request) {

        return mecanicoService.actualizar(id, request);

    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {

        mecanicoService.eliminar(id);

    }

}