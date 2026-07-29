package com.autofix.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "mecanicos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Mecanico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    @Column(length = 100)
    private String especialidad;

    @Builder.Default
    @OneToMany(mappedBy = "mecanico")
    private List<OrdenTrabajo> ordenes = new ArrayList<>();
}