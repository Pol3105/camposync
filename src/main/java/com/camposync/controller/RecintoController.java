package com.camposync.controller;

import com.camposync.dto.RecintoDTO;
import com.camposync.service.RecintoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recintos")
@RequiredArgsConstructor
public class RecintoController {

    private final RecintoService recintoService;

    @GetMapping("/parcela/{parcelaId}")
    public ResponseEntity<List<RecintoDTO>> listarPorParcela(@PathVariable Long parcelaId) {
        return ResponseEntity.ok(
                recintoService.listarPorParcela(parcelaId, currentUsername())
        );
    }

    private String currentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
