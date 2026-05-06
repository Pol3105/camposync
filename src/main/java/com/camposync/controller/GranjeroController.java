package com.camposync.controller;

import com.camposync.dto.GranjeroDTO;
import com.camposync.entity.Granjero;
import com.camposync.repository.ExplotacionRepository;
import com.camposync.repository.GranjeroRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/granjero")
@RequiredArgsConstructor
public class GranjeroController {

    private final GranjeroRepository granjeroRepository;
    private final ExplotacionRepository explotacionRepository;

    @GetMapping("/perfil")
    public ResponseEntity<GranjeroDTO> getPerfil() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Granjero g = granjeroRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Granjero no encontrado"));
        int numExp = explotacionRepository.findByGranjero_Id(g.getId()).size();
        GranjeroDTO dto = new GranjeroDTO(
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
        return ResponseEntity.ok(dto);
    }
}
