package com.camposync.entity;

import jakarta.persistence.*;
import lombok.*;

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

    @Column(name = "plaga_objetivo")
    private String plagaObjetivo;

    @Column(name = "equipo_aplicacion")
    private String equipoAplicacion;

    @Column(name = "superficie_tratada", nullable = false)
    private double superficieTratada;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "parcela_id", nullable = false)
    private Parcela parcela;

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
