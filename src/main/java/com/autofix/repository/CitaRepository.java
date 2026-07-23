package com.autofix.repository;

import com.autofix.entity.Cita;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CitaRepository extends JpaRepository<Cita, Long> {

    List<Cita> findByVehiculoId(Long vehiculoId);

    List<Cita> findByVehiculoClienteId(Long clienteId);
}