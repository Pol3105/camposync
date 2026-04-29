package com.camposync.dto;

import jakarta.validation.constraints.NotBlank;

public record RegisterRequest(
        @NotBlank String username,
        @NotBlank String password,
        @NotBlank String tipo,   // "ASESOR" o "GRANJERO"
        Long asesoriaId,         // requerido si tipo = ASESOR
        boolean esJefe,          // opcional, solo para ASESOR
        String numLeg            // opcional, solo para GRANJERO
) {}
