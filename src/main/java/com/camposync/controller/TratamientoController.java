package com.camposync.controller;

import com.camposync.dto.TratamientoCreateRequest;
import com.camposync.dto.TratamientoDTO;
import com.camposync.dto.TratamientoUpdateRequest;
import com.camposync.service.TratamientoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tratamientos")
@RequiredArgsConstructor
public class TratamientoController {

    private final TratamientoService tratamientoService;

    @GetMapping
    public ResponseEntity<List<TratamientoDTO>> listar(@RequestParam(required = false) String strategy) {
        return ResponseEntity.ok(tratamientoService.listarPorGranjero(currentUsername(), strategy));
    }


    @PostMapping
    public ResponseEntity<TratamientoDTO> crear(@Valid @RequestBody TratamientoCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(tratamientoService.crear(currentUsername(), request));
    }

    @GetMapping("/recinto/{recintoId}")
    public ResponseEntity<List<TratamientoDTO>> listarPorRecinto(@PathVariable Long recintoId) {
        return ResponseEntity.ok(tratamientoService.listarPorRecinto(recintoId, currentUsername()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TratamientoDTO> actualizar(@PathVariable Long id, @Valid @RequestBody TratamientoUpdateRequest request) {
        return ResponseEntity.ok(tratamientoService.actualizar(currentUsername(), id, request));
    }

    private String currentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
