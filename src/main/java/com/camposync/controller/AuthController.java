package com.camposync.controller;

import com.camposync.dto.LoginRequest;
import com.camposync.dto.LoginResponse;
import com.camposync.dto.RegisterInviteRequest;
import com.camposync.dto.RegisterRequest;
import com.camposync.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // ── POST /api/auth/login ──────────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request.username(), request.password());
        return ResponseEntity.ok(response);
    }

    // ── POST /api/auth/register ───────────────────────────────────────────────

    @PostMapping("/register")
    public ResponseEntity<Void> register(@Valid @RequestBody RegisterRequest request) {

        // Medida de seguridad extra: Si alguien intenta registrar algo que no sea ASESOR por aquí, bloqueado.
        if (!"ASESOR".equalsIgnoreCase(request.tipo())) {
            return ResponseEntity.badRequest().build();
        }

        if (request.asesoriaId() == null) {
                    // Flujo público: crea una Asesoría nueva y el Asesor jefe
                    if (request.nombreAsesoria() == null || request.nombreAsesoria().isBlank()) {
                        return ResponseEntity.badRequest().build();
                    }
                    authService.registerNuevaAsesoria(
                            request.username(), request.password(),
                            request.nombreAsesor(), request.nombreAsesoria());
                } else {
                    // Flujo interno: une a un Asesor a una Asesoría ya existente
                    authService.registerAsesor(
                            request.username(), request.password(),
                            request.nombreAsesor(),
                            request.asesoriaId(), Boolean.TRUE.equals(request.esJefe()));
                }
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // ── POST /api/auth/register-invite/{token} ────────────────────────────────
    // Flujo atómico: valida invitación → crea Granjero → acepta → devuelve JWT

    @PostMapping("/register-invite/{token}")
    public ResponseEntity<LoginResponse> registerViaInvite(
            @PathVariable String token,
            @Valid @RequestBody RegisterInviteRequest request) {

        LoginResponse response = authService.registerViaInvite(
                token,
                 request.username(), request.password(), request.nombre());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
