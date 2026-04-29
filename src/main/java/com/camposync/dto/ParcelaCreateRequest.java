package com.camposync.dto;

import jakarta.validation.constraints.NotNull;

public record ParcelaCreateRequest(
        @NotNull Long explotacionId,
        String refCatastral,
        Float superficie,
        String cultivo,
        String municipio
) {}
