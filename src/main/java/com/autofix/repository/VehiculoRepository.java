package com.autofix.repository;

import com.autofix.entity.Vehiculo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VehiculoRepository extends JpaRepository<Vehiculo, Long> {

    List<Vehiculo> findByClienteId(Long clienteId);

    Optional<Vehiculo> findByPlaca(String placa);

    boolean existsByPlaca(String placa);
}