package com.camposync.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "producto_fitosanitario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductoFitosanitario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(name = "principio_act")
    private String principioAct;

    @Column(name = "num_reg")
    private String numReg;

    @Column(name = "cultivos_autori")
    private String cultivosAutori;

    @Column(name = "fecha_cadu")
    private LocalDate fechaCadu;

    @Column(nullable = false)
    private boolean activo;

    // ── Campos de validación MAPA ────────────────────────────────────────────
    @Column(name = "dosis_min", precision = 10, scale = 4)
    private BigDecimal dosisMin;

    @Column(name = "dosis_max", precision = 10, scale = 4)
    private BigDecimal dosisMax;

    @Column(name = "unidad_dosis_oficial", length = 20)
    private String unidadDosisOficial;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    private void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    private void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
