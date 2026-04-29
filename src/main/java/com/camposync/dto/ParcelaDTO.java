package com.camposync.dto;

import java.time.LocalDateTime;

public record ParcelaDTO(
        Long id,
        String refCatastral,
        Float superficie,
        String cultivo,
        String municipio,
        Long explotacionId,
        String explotacionNombre,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
