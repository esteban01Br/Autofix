package com.autofix.repository;

import com.autofix.entity.Mecanico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MecanicoRepository extends JpaRepository<Mecanico, Long> {

    Optional<Mecanico> findByUsuarioId(Long usuarioId);
}