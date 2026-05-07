package com.camposync.dto;

import jakarta.validation.constraints.NotBlank;

public record EquipamientoUpdateRequest(
        @NotBlank String alias,
        String tipoMaquina,
        String marcaModelo,
        String numRegistroIteaf
) {}
