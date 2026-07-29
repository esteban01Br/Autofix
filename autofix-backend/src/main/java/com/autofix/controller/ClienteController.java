package com.autofix.controller;

import com.autofix.dto.request.cliente.ClienteRequest;
import com.autofix.dto.response.cliente.ClienteResponse;
import com.autofix.service.ClienteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ClienteController {

    private final ClienteService clienteService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClienteResponse crear(@Valid @RequestBody ClienteRequest request) {

        return clienteService.crear(request);

    }

    @GetMapping
    public List<ClienteResponse> listar() {

        return clienteService.listar();

    }

    @GetMapping("/{id}")
    public ClienteResponse buscarPorId(@PathVariable Long id) {

        return clienteService.buscarPorId(id);

    }

    @PutMapping("/{id}")
    public ClienteResponse actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ClienteRequest request) {

        return clienteService.actualizar(id, request);

    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {

        clienteService.eliminar(id);

    }

}