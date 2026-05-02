package com.camposync.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "explotacion")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Explotacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    // Mantener ref_sig como legacy hasta migración completa a SIGPAC
    @Column(name = "ref_sig")
    private String refSig;

    @Column(name = "superficie_total", precision = 10, scale = 4)
    private BigDecimal superficieTotal;

    private String estado;

    // ── Campos SIEX obligatorios ─────────────────────────────────────────────
    @Column(name = "codigo_rea", length = 20)
    private String codigoRea;

    @Column(name = "tipo_explotacion", length = 2)
    private String tipoExplotacion;

    @Column(name = "orientacion_productiva", length = 4)
    private String orientacionProductiva;

    @Column(name = "provincia_explotacion", length = 2)
    private String provinciaExplotacion;

    @Column(name = "municipio_explotacion", length = 5)
    private String municipioExplotacion;

    @Column(name = "anio_declaracion")
    private Integer anioDeclaracion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "asesoria_id", nullable = false)
    private Asesoria asesoria;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Granjero granjero;

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
