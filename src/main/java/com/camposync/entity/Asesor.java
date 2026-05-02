package com.camposync.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "asesor")
@DiscriminatorValue("ASESOR")
@Getter @Setter @NoArgsConstructor  @AllArgsConstructor @SuperBuilder
public class Asesor extends Usuario {

    @PrimaryKeyJoinColumn(name = "id")

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "asesoria_id", nullable = false)
    private Asesoria asesoria;

    @Column(name = "es_jefe", nullable = false)
    private boolean esJefe;

    @Column(name = "num_colegiado")
    private String numColegiado;
}
