package com.camposync.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record AsesorExplotacionCreateRequest(
        @NotBlank String nombre,
        String refSig,
        BigDecimal superficieTotal,
        @NotNull Long granjeroId,
        // SIEX (opcionales en creación)
        String codigoRea,
        String tipoExplotacion,
        String orientacionProductiva,
        String provinciaExplotacion,
        String municipioExplotacion,
        Integer anioDeclaracion
) {}
