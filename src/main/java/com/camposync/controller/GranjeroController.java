package com.camposync.controller;

import com.camposync.dto.GranjeroActualizarPerfilRequest;
import com.camposync.dto.GranjeroDTO;
import com.camposync.entity.Granjero;
import com.camposync.repository.ExplotacionRepository;
import com.camposync.repository.GranjeroRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/granjero")
@RequiredArgsConstructor
public class GranjeroController {

    private final GranjeroRepository granjeroRepository;
    private final ExplotacionRepository explotacionRepository;

    @GetMapping("/perfil")
    public ResponseEntity<GranjeroDTO> getPerfil() {
        Granjero g = resolverGranjero();
        return ResponseEntity.ok(toDTO(g));
    }

    @PutMapping("/perfil")
    public ResponseEntity<GranjeroDTO> actualizarPerfil(@RequestBody GranjeroActualizarPerfilRequest req) {
        Granjero g = resolverGranjero();
        if (req.nif()         != null) g.setNif(req.nif());
        if (req.nombreLegal() != null) g.setNombreLegal(req.nombreLegal());
        granjeroRepository.save(g);
        return ResponseEntity.ok(toDTO(g));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Granjero resolverGranjero() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return granjeroRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Granjero no encontrado"));
    }

    private GranjeroDTO toDTO(Granjero g) {
        int numExp = explotacionRepository.findByGranjero_Id(g.getId()).size();
        return new GranjeroDTO(
                g.getId(),
                g.getUsername(),
                g.getNombre(),
                g.getNif(),
                g.getNombreLegal(),
                g.getCnae(),
                g.getTelefono(),
                g.getAsesoria() != null ? g.getAsesoria().getId() : null,
                numExp,
                g.getCreatedAt()
        );
    }
}
