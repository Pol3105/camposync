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

    private static final java.util.Map<String, String> SYNONYMS = java.util.Map.ofEntries(
        java.util.Map.entry("caracoles", "metaldehido"),
        java.util.Map.entry("caracol", "metaldehido"),
        java.util.Map.entry("babosas", "metaldehido"),
        java.util.Map.entry("babosa", "metaldehido"),
        java.util.Map.entry("limacos", "metaldehido"),
        java.util.Map.entry("limaco", "metaldehido"),
        java.util.Map.entry("malas hierbas", "glifosato"),
        java.util.Map.entry("mala hierba", "glifosato"),
        java.util.Map.entry("hierba", "glifosato"),
        java.util.Map.entry("hierbas", "glifosato"),
        java.util.Map.entry("bichos", "deltametrin"),
        java.util.Map.entry("bicho", "deltametrin"),
        java.util.Map.entry("hongos", "cobre"),
        java.util.Map.entry("hongo", "cobre")
    );

    @GetMapping("/search")
    public ResponseEntity<List<ProductoFitosanitarioDTO>> search(@org.springframework.web.bind.annotation.RequestParam String query) {
        if (query.trim().length() < 2) {
            return ResponseEntity.ok(List.of());
        }
        
        // Strip accents/diacritics from the query so "Cúprico" becomes "Cuprico"
        String normalizedQuery = java.text.Normalizer.normalize(query.trim(), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");

        List<ProductoFitosanitarioDTO> list = doSearch(normalizedQuery);
        
        // Fallback: If no results found, check for synonyms (Query Expansion / Translation)
        if (list.isEmpty()) {
            String queryLower = normalizedQuery.toLowerCase();
            for (java.util.Map.Entry<String, String> entry : SYNONYMS.entrySet()) {
                if (queryLower.contains(entry.getKey())) {
                    list = doSearch(entry.getValue());
                    if (!list.isEmpty()) {
                        break;
                    }
                }
            }
        }
        
        return ResponseEntity.ok(list);
    }

    private List<ProductoFitosanitarioDTO> doSearch(String query) {
        return productoRepository.searchActiveProducts(query)
                .stream()
                .limit(50)
                .map(p -> new ProductoFitosanitarioDTO(
                        p.getId(),
                        p.getNombre(),
                        p.getPrincipioAct(),
                        p.getNumReg(),
                        p.getUnidadDosisOficial()))
                .toList();
    }
}
