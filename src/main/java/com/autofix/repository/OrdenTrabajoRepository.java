package com.autofix.repository;

import com.autofix.entity.OrdenTrabajo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrdenTrabajoRepository extends JpaRepository<OrdenTrabajo, Long> {

    List<OrdenTrabajo> findByVehiculoId(Long vehiculoId);

    List<OrdenTrabajo> findByMecanicoId(Long mecanicoId);

    List<OrdenTrabajo> findByVehiculoClienteId(Long clienteId);
}