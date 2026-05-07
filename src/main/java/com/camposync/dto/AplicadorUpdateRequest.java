package com.camposync.dto;

import jakarta.validation.constraints.NotBlank;

public record AplicadorUpdateRequest(
        @NotBlank String nombre,
        String nif,
        String numeroRopo,
        String nivelCapacitacion
) {}
