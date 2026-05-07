package com.camposync.controller;

import com.camposync.dto.AplicadorCreateRequest;
import com.camposync.dto.AplicadorDTO;
import com.camposync.service.AplicadorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/aplicadores")
@RequiredArgsConstructor
public class AplicadorController {

    private final AplicadorService aplicadorService;

    @GetMapping
    public ResponseEntity<List<AplicadorDTO>> listar() {
        return ResponseEntity.ok(aplicadorService.listarPorGranjero(currentUsername()));
    }

    @PostMapping
    public ResponseEntity<AplicadorDTO> crear(@Valid @RequestBody AplicadorCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(aplicadorService.crear(currentUsername(), req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        aplicadorService.eliminar(currentUsername(), id);
        return ResponseEntity.noContent().build();
    }

    private String currentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
