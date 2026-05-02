package com.camposync.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "granjero")
@DiscriminatorValue("GRANJERO")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @SuperBuilder
public class Granjero extends Usuario {

    @PrimaryKeyJoinColumn(name = "id")

    @Column(name = "cnae")
    private String cnae;

    @Column(name = "telefono")
    private String telefono;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asesoria_id")
    private Asesoria asesoria;
}
