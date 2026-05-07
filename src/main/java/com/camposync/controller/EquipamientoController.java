package com.camposync.controller;

import com.camposync.dto.EquipamientoCreateRequest;
import com.camposync.dto.EquipamientoDTO;
import com.camposync.dto.EquipamientoUpdateRequest;
import com.camposync.service.EquipamientoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipamiento")
@RequiredArgsConstructor
public class EquipamientoController {

    private final EquipamientoService equipamientoService;

    @GetMapping
    public ResponseEntity<List<EquipamientoDTO>> listar() {
        return ResponseEntity.ok(equipamientoService.listarPorGranjero(currentUsername()));
    }

    @PostMapping
    public ResponseEntity<EquipamientoDTO> crear(@Valid @RequestBody EquipamientoCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(equipamientoService.crear(currentUsername(), req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EquipamientoDTO> actualizar(@PathVariable Long id, @Valid @RequestBody EquipamientoUpdateRequest req) {
        return ResponseEntity.ok(equipamientoService.actualizar(currentUsername(), id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        equipamientoService.eliminar(currentUsername(), id);
        return ResponseEntity.noContent().build();
    }

    private String currentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
