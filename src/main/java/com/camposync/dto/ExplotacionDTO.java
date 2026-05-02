package com.camposync.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ExplotacionDTO(
        Long id,
        String nombre,
        String refSig,
        BigDecimal superficieTotal,
        String estado,
        // SIEX
        String codigoRea,
        String tipoExplotacion,
        String orientacionProductiva,
        String provinciaExplotacion,
        String municipioExplotacion,
        Integer anioDeclaracion,
        // Relaciones
        Long asesoriaId,
        String asesorianombre,
        Long granjeroId,
        int numParcelas,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
