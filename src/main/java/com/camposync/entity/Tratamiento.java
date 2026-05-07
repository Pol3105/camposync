package com.camposync.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tratamiento")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tratamiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "texto_original")
    private String textoOriginal;

    @Column(name = "ai_confidence")
    private float aiConfidence;

    @Column(nullable = false)
    private float dosis;

    @Column(nullable = false)
    private String unidades;

    private String estado;

    @Column(nullable = false)
    private boolean validado;

    @Column(name = "observaciones_validador", columnDefinition = "TEXT")
    private String observacionesValidador;

    @Column(name = "plaga_objetivo")
    private String plagaObjetivo;

    @Column(name = "superficie_tratada", nullable = false)
    private double superficieTratada;

    // ── Campos SIEX obligatorios ─────────────────────────────────────────────

    /** PR=Preventivo, CU=Curativo, ED=Erradicación de delimitación */
    @Column(name = "motivo_tratamiento", length = 2)
    private String motivoTratamiento;

    /** Código EPPO de la plaga u organismo nocivo */
    @Column(name = "codigo_plaga")
    private String codigoPlaga;

    @Column(name = "volumen_caldo", precision = 10, scale = 2)
    private BigDecimal volumenCaldo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aplicador_id")
    private Aplicador aplicador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipamiento_id")
    private Equipamiento equipamiento;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recinto_id", nullable = false)
    private Recinto recinto;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Granjero granjero;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "producto_fito_id", nullable = false)
    private ProductoFitosanitario productoFitosanitario;

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
