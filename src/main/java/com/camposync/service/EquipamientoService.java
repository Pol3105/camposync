package com.camposync.service;

import com.camposync.dto.EquipamientoCreateRequest;
import com.camposync.dto.EquipamientoDTO;
import com.camposync.entity.Equipamiento;
import com.camposync.entity.Granjero;
import com.camposync.exception.ResourceNotFoundException;
import com.camposync.repository.EquipamientoRepository;
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
public class EquipamientoService {

    private final EquipamientoRepository equipamientoRepository;
    private final GranjeroRepository granjeroRepository;

    public List<EquipamientoDTO> listarPorGranjero(String username) {
        Granjero granjero = resolveGranjero(username);
        return equipamientoRepository.findByGranjero_Id(granjero.getId())
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public EquipamientoDTO crear(String username, EquipamientoCreateRequest req) {
        Granjero granjero = resolveGranjero(username);
        Equipamiento equipamiento = Equipamiento.builder()
                .alias(req.alias())
                .tipoMaquina(req.tipoMaquina())
                .marcaModelo(req.marcaModelo())
                .numRegistroIteaf(req.numRegistroIteaf())
                .granjero(granjero)
                .build();
        return toDTO(equipamientoRepository.save(equipamiento));
    }

    @Transactional
    public void eliminar(String username, Long id) {
        Granjero granjero = resolveGranjero(username);
        Equipamiento equipamiento = equipamientoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipamiento", id));
        if (!equipamiento.getGranjero().getId().equals(granjero.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso para eliminar este equipamiento");
        }
        equipamientoRepository.delete(equipamiento);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Granjero resolveGranjero(String username) {
        return granjeroRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Granjero", username));
    }

    private EquipamientoDTO toDTO(Equipamiento e) {
        return new EquipamientoDTO(e.getId(), e.getAlias(), e.getTipoMaquina(), e.getMarcaModelo(), e.getNumRegistroIteaf());
    }
}
