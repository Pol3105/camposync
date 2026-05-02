package com.camposync.dto;

import java.time.LocalDateTime;

public record GranjeroDTO(
        Long id,
        String username,
        String nombre,
        String nif,
        String nombreLegal,
        String cnae,
        String telefono,
        Long asesoriaId,
        int numExplotaciones,
        LocalDateTime createdAt
) {}
