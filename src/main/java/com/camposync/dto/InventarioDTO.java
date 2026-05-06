package com.camposync.dto;

public record InventarioDTO(
        Long id,
        String aliasAgric,
        float stockAct,
        String unidadMedida,
        Long productoFitosanitarioId,
        String productoNombre,
        String principioAct
) {}
