package com.camposync.dto;

public record InventarioDTO(
        Long id,
        String aliasAgric,
        float stockAct,
        String unidad,              // derived from productoFitosanitario.unidadDosisOficial
        Long productoFitosanitarioId,
        String productoNombre,
        String principioAct,
        String unidadDosisOficial   // raw field forwarded for frontend UX hints
) {}
