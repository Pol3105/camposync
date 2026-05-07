package com.camposync.dto;

import jakarta.validation.constraints.NotBlank;

public record AplicadorCreateRequest(
        @NotBlank String nombre,
        String nif,
        String numeroRopo,
        String nivelCapacitacion
) {}
