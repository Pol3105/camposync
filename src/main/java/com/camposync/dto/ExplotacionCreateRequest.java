package com.camposync.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ExplotacionCreateRequest(
        @NotBlank String nombre,
        String refSig,
        Float superficieHa,
        String cultivo,
        String estado,
        @NotNull Long asesoriaId
) {}
