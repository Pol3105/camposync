package com.camposync.dto;

public record AsesorParcelaCreateRequest(
        String refCatastral,
        String municipio,
        String provincia,
        Integer agregado,
        Integer zona,
        Integer poligono,
        Integer parcelaSigpac
) {}
