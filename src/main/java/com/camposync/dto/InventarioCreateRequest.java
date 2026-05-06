package com.camposync.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record InventarioCreateRequest(
        @NotNull Long productoFitoId,
        @NotNull @Positive Float stockAct,
        String aliasAgric
) {}
