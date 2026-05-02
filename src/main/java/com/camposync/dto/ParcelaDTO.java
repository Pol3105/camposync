package com.camposync.dto;

import java.time.LocalDateTime;

public record ParcelaDTO(
        Long id,
        String refCatastral,
        String municipio,
        String provincia,
        Integer agregado,
        Integer zona,
        Integer poligono,
        Integer parcelaSigpac,
        Long explotacionId,
        String explotacionNombre,
        int numRecintos,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
