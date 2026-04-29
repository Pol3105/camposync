package com.camposync.controller;

import com.camposync.dto.ParcelaCreateRequest;
import com.camposync.dto.ParcelaDTO;
import com.camposync.service.ParcelaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parcelas")
@RequiredArgsConstructor
public class ParcelaController {

    private final ParcelaService parcelaService;

    @PostMapping
    public ResponseEntity<ParcelaDTO> crear(@Valid @RequestBody ParcelaCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(parcelaService.crear(currentUsername(), request));
    }

    @GetMapping("/explotacion/{explotacionId}")
    public ResponseEntity<List<ParcelaDTO>> listarPorExplotacion(@PathVariable Long explotacionId) {
        return ResponseEntity.ok(parcelaService.listarPorExplotacion(explotacionId, currentUsername()));
    }

    private String currentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
