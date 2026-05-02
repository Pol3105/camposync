package com.camposync.dto;

import jakarta.validation.constraints.NotNull;

public record ParcelaCreateRequest(
        @NotNull Long explotacionId,
        String refCatastral,
        String municipio,
        String provincia,
        Integer agregado,
        Integer zona,
        Integer poligono,
        Integer parcelaSigpac
) {}
