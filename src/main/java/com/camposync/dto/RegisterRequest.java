package com.camposync.dto;

import jakarta.validation.constraints.NotBlank;

public record RegisterRequest(
        @NotBlank String username,
        @NotBlank String password,
        @NotBlank String tipo,       // "ASESOR" o "GRANJERO"
        String nombreAsesor,         // solo para tipo ASESOR (nombre personal)
        String nifAsesor,            // solo para tipo ASESOR (nif)
        String nombreLegalAsesor,    // solo para tipo ASESOR (nombre legal)
        String nombreAsesoria,       // solo para tipo ASESOR (crea nueva asesoría)
        Long asesoriaId,             // alternativo: unirse a asesoría existente
        Boolean esJefe,              // solo cuando se une a asesoría existente
        String cnae                  // solo para tipo GRANJERO (código CNAE de actividad)
) {}
