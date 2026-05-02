package com.camposync.dto;

public record InventarioDTO(
        Long id,
        String aliasAgric,
        float stockAct,
        Long productoFitosanitarioId,
        String productoNombre,
        String principioAct
) {}
