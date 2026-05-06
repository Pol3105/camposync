package com.camposync.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "invitacion")
@Getter @Setter @NoArgsConstructor  @AllArgsConstructor @Builder
public class Invitacion {

    @Id
    @Column(nullable = false, unique = true)
    private String token;

    @Column(name = "email_invitado", nullable = false)
    private String emailInvitado;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoInvitacion estado;

    @Column(name = "rol_destino", nullable = false, length = 20)
    private String rolDestino;

    @Column(name = "expira_en", nullable = false)
    private LocalDateTime expiraEn;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "asesoria_id", nullable = false)
    private Asesoria asesoria;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    private void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum EstadoInvitacion {
        PENDIENTE,
        ACEPTADA,
        EXPIRADA,
        CANCELADA
    }
}
