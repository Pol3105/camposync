package com.camposync.dto;

import com.camposync.entity.Invitacion.EstadoInvitacion;

import java.time.LocalDateTime;

public record InvitacionDTO(
        String token,
        String emailInvitado,
        EstadoInvitacion estado,
        LocalDateTime expiraEn,
        Long asesoriaId,
        String asesoriaNombre,
        LocalDateTime createdAt,
        String rolDestino
) {}
