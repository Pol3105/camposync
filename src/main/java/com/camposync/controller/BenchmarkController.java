package com.camposync.controller;

import com.camposync.dto.TratamientoDTO;
import com.camposync.service.TratamientoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoint público para benchmarks del Experimento 2 (Big Data).
 * Permite comparar estrategias de carga Hibernate sin autenticación JWT.
 * 
 * IMPORTANTE: Este controlador es SOLO para uso en benchmarks locales.
 * En producción debería estar desactivado o protegido.
 */
@RestController
@RequestMapping("/api/benchmark")
@RequiredArgsConstructor
public class BenchmarkController {

    private final TratamientoService tratamientoService;

    @GetMapping("/tratamientos")
    public ResponseEntity<List<TratamientoDTO>> benchmarkTratamientos(
            @RequestParam String username,
            @RequestParam(required = false, defaultValue = "lazy") String strategy) {
        return ResponseEntity.ok(tratamientoService.listarPorGranjero(username, strategy));
    }
}
