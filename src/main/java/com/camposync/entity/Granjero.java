package com.camposync.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "granjero")   @DiscriminatorValue("GRANJERO") @Getter @Setter @NoArgsConstructor  @AllArgsConstructor @SuperBuilder
public class Granjero extends Usuario {

    @PrimaryKeyJoinColumn(name = "id")
    
    @Column(name = "num_leg")
    private String numLeg;
}
