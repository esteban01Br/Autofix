package com.autofix.repository;

import com.autofix.entity.DetalleOrden;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DetalleOrdenRepository extends JpaRepository<DetalleOrden, Long> {

    List<DetalleOrden> findByOrdenTrabajoId(Long ordenTrabajoId);
}