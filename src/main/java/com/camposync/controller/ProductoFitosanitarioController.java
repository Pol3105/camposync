package com.camposync.controller;

import com.camposync.dto.ProductoFitosanitarioDTO;
import com.camposync.entity.ProductoFitosanitario;
import com.camposync.repository.ProductoFitosanitarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
public class ProductoFitosanitarioController {

    private final ProductoFitosanitarioRepository productoRepository;

    @GetMapping
    public ResponseEntity<List<ProductoFitosanitarioDTO>> listar() {
        List<ProductoFitosanitarioDTO> list = productoRepository.findByActivoTrue()
                .stream()
                .map(p -> new ProductoFitosanitarioDTO(
                        p.getId(),
                        p.getNombre(),
                        p.getPrincipioAct(),
                        p.getNumReg(),
                        p.getUnidadDosisOficial()))
                .sorted((a, b) -> a.nombre().compareToIgnoreCase(b.nombre()))
                .toList();
        return ResponseEntity.ok(list);
    }
}
