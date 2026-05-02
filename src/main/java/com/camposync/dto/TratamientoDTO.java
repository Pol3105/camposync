package com.camposync.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record TratamientoDTO(
        Long id,
        LocalDate fecha,
        String textoOriginal,
        Float dosis,
        String unidades,
        String estado,
        boolean validado,
        String observacionesValidador,
        String plagaObjetivo,
        Double superficieTratada,
        // Recinto → Parcela → Explotacion
        Long recintoId,
        Integer recintoNumero,
        String recintoCultivo,
        Long parcelaId,
        String parcelaRefCatastral,
        String parcelaMunicipio,
        // Producto
        Long productoFitosanitarioId,
        String productoNombre,
        String productoPrincipioActivo,
        // Granjero
        String granjeroUsername,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String aliasAgric,
        String explotacionNombre,
        String granjeroNombre,
        // SIEX
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
