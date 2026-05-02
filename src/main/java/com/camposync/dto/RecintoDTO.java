package com.camposync.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RecintoDTO(
        Long id,
        Integer numeroRecinto,
        BigDecimal superficie,
        String usoSigpac,
        String sistemaCultivo,
        String cultivo,
        Long parcelaId,
        String parcelaRefCatastral,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
