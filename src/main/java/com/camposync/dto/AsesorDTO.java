package com.camposync.dto;

import java.time.LocalDateTime;

public record AsesorDTO(
        Long id,
        String username,
        String nombre,
        String nif,
        String nombreLegal,
        String numColegiado,
        Long asesoriaId,
        String asesorianombre,
        boolean esJefe,
        LocalDateTime createdAt
) {}
