package com.camposync.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TratamientoUpdateRequest(
        @NotNull Long recintoId,
        @NotNull Long productoFitosanitarioId,
        @NotNull LocalDate fecha,
        @NotNull @Positive Float dosis,
        @NotBlank String unidades,
        @NotNull @Positive Double superficieTratada,
        String textoOriginal,
        String plagaObjetivo,
        // SIEX (todos opcionales)
        String motivoTratamiento,
        String codigoPlaga,
        BigDecimal volumenCaldo,
        // Recursos vinculados (opcionales)
        Long aplicadorId,
        Long equipamientoId
) {}
