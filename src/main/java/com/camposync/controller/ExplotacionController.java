package com.camposync.controller;

import com.camposync.dto.ExplotacionCreateRequest;
import com.camposync.dto.ExplotacionDTO;
import com.camposync.service.ExplotacionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/explotaciones")
@RequiredArgsConstructor
public class ExplotacionController {

    private final ExplotacionService explotacionService;

    @PostMapping
    public ResponseEntity<ExplotacionDTO> crear(@Valid @RequestBody ExplotacionCreateRequest request) {
        String username = currentUsername();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(explotacionService.crear(username, request));
    }

    @GetMapping
    public ResponseEntity<List<ExplotacionDTO>> listar() {
        return ResponseEntity.ok(explotacionService.listarPorGranjero(currentUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExplotacionDTO> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(explotacionService.obtenerPorId(id, currentUsername()));
    }

    private String currentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
