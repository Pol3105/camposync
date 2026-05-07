package com.camposync.service;

import com.camposync.dto.AplicadorCreateRequest;
import com.camposync.dto.AplicadorDTO;
import com.camposync.entity.Aplicador;
import com.camposync.entity.Granjero;
import com.camposync.exception.ResourceNotFoundException;
import com.camposync.repository.AplicadorRepository;
import com.camposync.repository.GranjeroRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AplicadorService {

    private final AplicadorRepository aplicadorRepository;
    private final GranjeroRepository granjeroRepository;

    public List<AplicadorDTO> listarPorGranjero(String username) {
        Granjero granjero = resolveGranjero(username);
        return aplicadorRepository.findByGranjero_Id(granjero.getId())
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public AplicadorDTO crear(String username, AplicadorCreateRequest req) {
        Granjero granjero = resolveGranjero(username);
        Aplicador aplicador = Aplicador.builder()
                .nombre(req.nombre())
                .nif(req.nif())
                .numeroRopo(req.numeroRopo())
                .nivelCapacitacion(req.nivelCapacitacion())
                .granjero(granjero)
                .build();
        return toDTO(aplicadorRepository.save(aplicador));
    }

    @Transactional
    public void eliminar(String username, Long id) {
        Granjero granjero = resolveGranjero(username);
        Aplicador aplicador = aplicadorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Aplicador", id));
        if (!aplicador.getGranjero().getId().equals(granjero.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso para eliminar este aplicador");
        }
        aplicadorRepository.delete(aplicador);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Granjero resolveGranjero(String username) {
        return granjeroRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Granjero", username));
    }

    private AplicadorDTO toDTO(Aplicador a) {
        return new AplicadorDTO(a.getId(), a.getNombre(), a.getNif(), a.getNumeroRopo(), a.getNivelCapacitacion());
    }
}
