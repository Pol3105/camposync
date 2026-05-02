package com.camposync.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "recinto")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Recinto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_recinto", nullable = false)
    private Integer numeroRecinto;

    @Column(precision = 10, scale = 4)
    private BigDecimal superficie;

    @Column(name = "uso_sigpac", length = 10)
    private String usoSigpac;

    @Column(name = "sistema_cultivo", length = 50)
    private String sistemaCultivo;

    @Column(length = 10)
    private String cultivo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "parcela_id", nullable = false)
    private Parcela parcela;

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
