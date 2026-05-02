package com.camposync.dto;

import jakarta.validation.constraints.NotBlank;

public record RegisterInviteRequest(
        @NotBlank String username,
        @NotBlank String password,
        @NotBlank String nombre
) {}
