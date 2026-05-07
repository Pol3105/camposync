package com.camposync.dto;

public record EquipamientoDTO(
        Long id,
        String alias,
        String tipoMaquina,
        String marcaModelo,
        String numRegistroIteaf
) {}
