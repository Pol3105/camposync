package com.camposync.dto;

public record ActualizarPerfilRequest(
        String nombre,
        String nif,
        String nombreLegal,
        String numColegiado
) {}
