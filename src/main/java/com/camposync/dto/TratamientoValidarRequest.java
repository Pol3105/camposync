package com.camposync.dto;

import jakarta.validation.constraints.NotNull;

public record TratamientoValidarRequest(
        @NotNull boolean validado,
        String observacionesValidador,
        String plagaObjetivo,
        Long aplicadorId,
        Long equipamientoId
) {}