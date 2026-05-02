package com.camposync.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ExplotacionCreateRequest(
        @NotBlank String nombre,
        String refSig,
        BigDecimal superficieTotal,
        String estado,
        @NotNull Long asesoriaId,
        // SIEX (opcionales en creación)
        String codigoRea,
        String tipoExplotacion,
        String orientacionProductiva,
        String provinciaExplotacion,
        String municipioExplotacion,
        Integer anioDeclaracion
) {}
