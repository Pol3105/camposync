package com.camposync.dto;

import java.math.BigDecimal;

public record AsesorRecintoCreateRequest(
        Integer numeroRecinto,
        BigDecimal superficie,
        String usoSigpac,
        String sistemaCultivo,
        String cultivo
) {}
