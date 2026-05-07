package com.camposync.dto;

import jakarta.validation.constraints.NotBlank;

public record EquipamientoCreateRequest(
        @NotBlank String alias,
        String tipoMaquina,
        String marcaModelo,
        String numRegistroIteaf
) {}
