package com.camposync.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TratamientoCreateRequest(
        @NotNull Long recintoId,
        @NotNull Long productoFitosanitarioId,
        @NotNull LocalDate fecha,
        @NotNull @Positive Float dosis,
        @NotBlank String unidades,
        @NotNull @Positive Double superficieTratada,
        String textoOriginal,
        String plagaObjetivo,
        // SIEX (todos opcionales en creación)
        String motivoTratamiento,
        String codigoPlaga,
        String tipoEquipo,
        String numRegistroIteaf,
        LocalDate fechaIteaf,
        BigDecimal volumenCaldo,
        String nifAplicador,
        String numeroRopo,
        String nivelCapacitacionRopo
) {}
