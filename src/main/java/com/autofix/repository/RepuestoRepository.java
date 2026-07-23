package com.autofix.repository;

import com.autofix.entity.Repuesto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RepuestoRepository extends JpaRepository<Repuesto, Long> {

    boolean existsByNombreIgnoreCase(String nombre);
}