package com.camposync.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "equipamiento")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Equipamiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "alias", nullable = false)
    private String alias;

    @Column(name = "tipo_maquina")
    private String tipoMaquina;

    @Column(name = "marca_modelo")
    private String marcaModelo;

    @Column(name = "num_registro_iteaf")
    private String numRegistroIteaf;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Granjero granjero;
}
