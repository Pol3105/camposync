package com.camposync.controller;

import com.camposync.dto.AjusteStockRequest;
import com.camposync.dto.InventarioCreateRequest;
import com.camposync.dto.InventarioDTO;
import com.camposync.service.InventarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventario")
@RequiredArgsConstructor
public class InventarioController {

    private final InventarioService inventarioService;

    @GetMapping
    public ResponseEntity<List<InventarioDTO>> listar() {
        return ResponseEntity.ok(inventarioService.listarPorGranjero(currentUsername()));
    }

    @PostMapping
    public ResponseEntity<InventarioDTO> crear(@Valid @RequestBody InventarioCreateRequest req) {
        return ResponseEntity.ok(inventarioService.crear(currentUsername(), req));
    }

    @PatchMapping("/{id}/stock")
    public ResponseEntity<InventarioDTO> ajustarStock(@PathVariable Long id, @RequestBody AjusteStockRequest req) {
        return ResponseEntity.ok(inventarioService.ajustarStock(currentUsername(), id, req.nuevoStock()));
    }

    private String currentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
