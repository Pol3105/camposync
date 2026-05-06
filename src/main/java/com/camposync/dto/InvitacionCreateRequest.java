package com.camposync.dto;

import jakarta.validation.constraints.NotBlank;

public record InvitacionCreateRequest(
        @NotBlank String emailInvitado,
        String rolDestino               // 'AGRICULTOR' (default) o 'ASESOR'
) {}
