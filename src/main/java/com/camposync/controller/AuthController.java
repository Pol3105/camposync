package com.camposync.controller;

import com.camposync.dto.LoginRequest;
import com.camposync.dto.LoginResponse;
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

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        String token = authService.login(request.username(), request.password());
        return ResponseEntity.ok(new LoginResponse(token));
    }

    @PostMapping("/register")
    public ResponseEntity<Void> register(@Valid @RequestBody RegisterRequest request) {
        switch (request.tipo().toUpperCase()) {
            case "ASESOR" -> {
                if (request.asesoriaId() == null) {
                    return ResponseEntity.badRequest().build();
                }
                authService.registerAsesor(request.username(), request.password(), request.asesoriaId(), request.esJefe());
            }
            case "GRANJERO" -> authService.registerGranjero(request.username(), request.password(), request.numLeg());
            default -> { return ResponseEntity.badRequest().build(); }
        }
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
