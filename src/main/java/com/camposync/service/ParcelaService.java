package com.camposync.service;

import com.camposync.dto.ParcelaCreateRequest;
import com.camposync.dto.ParcelaDTO;
import com.camposync.entity.Explotacion;
import com.camposync.entity.Granjero;
import com.camposync.entity.Parcela;
import com.camposync.exception.ResourceNotFoundException;
import com.camposync.repository.ExplotacionRepository;
import com.camposync.repository.GranjeroRepository;
import com.camposync.repository.ParcelaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ParcelaService {

    private final ParcelaRepository parcelaRepository;
    private final ExplotacionRepository explotacionRepository;
    private final GranjeroRepository granjeroRepository;

    @Transactional
    public ParcelaDTO crear(String username, ParcelaCreateRequest request) {
        Granjero granjero = getGranjero(username);
        Explotacion explotacion = getExplotacionDelGranjero(request.explotacionId(), granjero);

        Parcela parcela = Parcela.builder()
                .refCatastral(request.refCatastral())
                .superficie(request.superficie() != null ? request.superficie() : 0f)
                .cultivo(request.cultivo())
                .municipio(request.municipio())
                .explotacion(explotacion)
                .build();

        return toDTO(parcelaRepository.save(parcela));
    }

    public List<ParcelaDTO> listarPorExplotacion(Long explotacionId, String username) {
        Granjero granjero = getGranjero(username);
        getExplotacionDelGranjero(explotacionId, granjero);

        return parcelaRepository.findByExplotacion_Id(explotacionId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    private Granjero getGranjero(String username) {
        return granjeroRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Granjero", username));
    }

    private Explotacion getExplotacionDelGranjero(Long explotacionId, Granjero granjero) {
        Explotacion explotacion = explotacionRepository.findById(explotacionId)
                .orElseThrow(() -> new ResourceNotFoundException("Explotación", explotacionId));

        if (!explotacion.getGranjero().getId().equals(granjero.getId())) {
            throw new ResourceNotFoundException("Explotación", explotacionId);
        }
        return explotacion;
    }

    private ParcelaDTO toDTO(Parcela p) {
        return new ParcelaDTO(
                p.getId(),
                p.getRefCatastral(),
                p.getSuperficie(),
                p.getCultivo(),
                p.getMunicipio(),
                p.getExplotacion().getId(),
                p.getExplotacion().getNombre(),
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
