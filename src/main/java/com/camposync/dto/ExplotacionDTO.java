package com.camposync.dto;

import java.time.LocalDateTime;

public record ExplotacionDTO(
        Long id,
        String nombre,
        String refSig,
        Float superficieHa,
        String cultivo,
        String estado,
        Long asesoriaId,
        String asesorianombre,
        Long granjeroId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
