package com.camposync.controller;

import com.camposync.dto.InvitacionCreateRequest;
import com.camposync.dto.InvitacionDTO;
import com.camposync.service.InvitacionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invitaciones")
@RequiredArgsConstructor
public class InvitacionController {

    private final InvitacionService invitacionService;

    // Solo Asesores
    @PostMapping
    public ResponseEntity<InvitacionDTO> crear(@Valid @RequestBody InvitacionCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(invitacionService.crear(currentUsername(), request));
    }

    // Solo Granjeros
    @GetMapping("/me")
    public ResponseEntity<List<InvitacionDTO>> listarMisInvitaciones() {
        return ResponseEntity.ok(invitacionService.listarMisInvitaciones(currentUsername()));
    }

    // Solo Granjeros
    @PostMapping("/{token}/aceptar")
    public ResponseEntity<InvitacionDTO> aceptar(@PathVariable String token) {
        return ResponseEntity.ok(invitacionService.aceptar(token, currentUsername()));
    }

    private String currentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
