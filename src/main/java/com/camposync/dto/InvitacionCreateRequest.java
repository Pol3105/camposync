package com.camposync.dto;

import jakarta.validation.constraints.NotBlank;

public record InvitacionCreateRequest(
        @NotBlank String emailInvitado   // username del granjero a invitar
) {}
