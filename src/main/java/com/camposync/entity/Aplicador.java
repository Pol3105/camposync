package com.camposync.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "aplicador")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Aplicador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre", nullable = false)
    private String nombre;

    @Column(name = "nif")
    private String nif;

    @Column(name = "numero_ropo")
    private String numeroRopo;

    @Column(name = "nivel_capacitacion")
    private String nivelCapacitacion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Granjero granjero;
}
