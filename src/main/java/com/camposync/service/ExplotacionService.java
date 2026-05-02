package com.camposync.service;

import com.camposync.dto.ExplotacionCreateRequest;
import com.camposync.dto.ExplotacionDTO;
import com.camposync.entity.Asesoria;
import com.camposync.entity.Explotacion;
import com.camposync.entity.Granjero;
import com.camposync.exception.ResourceNotFoundException;
import com.camposync.repository.AsesoriaRepository;
import com.camposync.repository.ExplotacionRepository;
import com.camposync.repository.GranjeroRepository;
import com.camposync.repository.ParcelaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExplotacionService {

    private final ExplotacionRepository explotacionRepository;
    private final GranjeroRepository granjeroRepository;
    private final AsesoriaRepository asesoriaRepository;
    private final ParcelaRepository parcelaRepository;

    @Transactional
    public ExplotacionDTO crear(String username, ExplotacionCreateRequest request) {
        Granjero granjero = granjeroRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Granjero", username));

        Asesoria asesoria = asesoriaRepository.findById(request.asesoriaId())
                .orElseThrow(() -> new ResourceNotFoundException("Asesoría", request.asesoriaId()));

        Explotacion explotacion = Explotacion.builder()
                .nombre(request.nombre())
                .refSig(request.refSig())
                .superficieTotal(request.superficieTotal() != null ? request.superficieTotal() : BigDecimal.ZERO)
                .estado(request.estado())
                .codigoRea(request.codigoRea())
                .tipoExplotacion(request.tipoExplotacion())
                .orientacionProductiva(request.orientacionProductiva())
                .provinciaExplotacion(request.provinciaExplotacion())
                .municipioExplotacion(request.municipioExplotacion())
                .anioDeclaracion(request.anioDeclaracion())
                .asesoria(asesoria)
                .granjero(granjero)
                .build();

        return toDTO(explotacionRepository.save(explotacion));
    }

    public List<ExplotacionDTO> listarPorGranjero(String username) {
        Granjero granjero = granjeroRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Granjero", username));

        return explotacionRepository.findByGranjero_Id(granjero.getId())
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public ExplotacionDTO obtenerPorId(Long id, String username) {
        Granjero granjero = granjeroRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Granjero", username));

        Explotacion explotacion = explotacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Explotación", id));

        if (!explotacion.getGranjero().getId().equals(granjero.getId())) {
            throw new ResourceNotFoundException("Explotación", id);
        }

        return toDTO(explotacion);
    }

    private ExplotacionDTO toDTO(Explotacion e) {
        int numParc = parcelaRepository.findByExplotacion_Id(e.getId()).size();
        return new ExplotacionDTO(
                e.getId(),
                e.getNombre(),
                e.getRefSig(),
                e.getSuperficieTotal(),
                e.getEstado(),
                e.getCodigoRea(),
                e.getTipoExplotacion(),
                e.getOrientacionProductiva(),
                e.getProvinciaExplotacion(),
                e.getMunicipioExplotacion(),
                e.getAnioDeclaracion(),
                e.getAsesoria().getId(),
                e.getAsesoria().getNombre(),
                e.getGranjero().getId(),
                numParc,
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}
