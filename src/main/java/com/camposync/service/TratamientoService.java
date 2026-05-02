package com.camposync.service;

import com.camposync.dto.TratamientoCreateRequest;
import com.camposync.dto.TratamientoDTO;
import com.camposync.entity.Granjero;
import com.camposync.entity.Recinto;
import com.camposync.entity.ProductoFitosanitario;
import com.camposync.entity.Tratamiento;
import com.camposync.exception.ResourceNotFoundException;
import com.camposync.repository.GranjeroRepository;
import com.camposync.repository.RecintoRepository;
import com.camposync.repository.ProductoFitosanitarioRepository;
import com.camposync.repository.TratamientoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TratamientoService {

    private final TratamientoRepository tratamientoRepository;
    private final RecintoRepository recintoRepository;
    private final GranjeroRepository granjeroRepository;
    private final ProductoFitosanitarioRepository productoRepository;

    @Transactional
    public TratamientoDTO crear(String username, TratamientoCreateRequest request) {
        Granjero granjero = getGranjero(username);
        Recinto recinto = getRecintoDelGranjero(request.recintoId(), granjero);

        ProductoFitosanitario producto = productoRepository.findById(request.productoFitosanitarioId())
                .orElseThrow(() -> new ResourceNotFoundException("ProductoFitosanitario", request.productoFitosanitarioId()));

        Tratamiento tratamiento = Tratamiento.builder()
                .fecha(request.fecha())
                .textoOriginal(request.textoOriginal())
                .dosis(request.dosis())
                .unidades(request.unidades())
                .superficieTratada(request.superficieTratada())
                .plagaObjetivo(request.plagaObjetivo())
                .estado("PENDIENTE")
                .validado(false)
                .aiConfidence(0f)
                .motivoTratamiento(request.motivoTratamiento())
                .codigoPlaga(request.codigoPlaga())
                .tipoEquipo(request.tipoEquipo())
                .numRegistroIteaf(request.numRegistroIteaf())
                .fechaIteaf(request.fechaIteaf())
                .volumenCaldo(request.volumenCaldo())
                .nifAplicador(request.nifAplicador())
                .numeroRopo(request.numeroRopo())
                .nivelCapacitacionRopo(request.nivelCapacitacionRopo())
                .recinto(recinto)
                .granjero(granjero)
                .productoFitosanitario(producto)
                .build();

        return toDTO(tratamientoRepository.save(tratamiento));
    }

    public List<TratamientoDTO> listarPorGranjero(String username) {
        Granjero granjero = getGranjero(username);
        return tratamientoRepository.findByGranjero_Id(granjero.getId())
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public List<TratamientoDTO> listarPorRecinto(Long recintoId, String username) {
        Granjero granjero = getGranjero(username);
        getRecintoDelGranjero(recintoId, granjero);
        return tratamientoRepository.findByRecinto_Id(recintoId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Granjero getGranjero(String username) {
        return granjeroRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Granjero", username));
    }

    private Recinto getRecintoDelGranjero(Long recintoId, Granjero granjero) {
        Recinto recinto = recintoRepository.findById(recintoId)
                .orElseThrow(() -> new ResourceNotFoundException("Recinto", recintoId));

        if (!recinto.getParcela().getExplotacion().getGranjero().getId().equals(granjero.getId())) {
            throw new ResourceNotFoundException("Recinto", recintoId);
        }
        return recinto;
    }

    private TratamientoDTO toDTO(Tratamiento t) {
        return new TratamientoDTO(
                t.getId(),
                t.getFecha(),
                t.getTextoOriginal(),
                t.getDosis(),
                t.getUnidades(),
                t.getEstado(),
                t.isValidado(),
                t.getObservacionesValidador(),
                t.getPlagaObjetivo(),
                t.getSuperficieTratada(),
                t.getRecinto().getId(),
                t.getRecinto().getNumeroRecinto(),
                t.getRecinto().getCultivo(),
                t.getRecinto().getParcela().getId(),
                t.getRecinto().getParcela().getRefCatastral(),
                t.getRecinto().getParcela().getMunicipio(),
                t.getProductoFitosanitario().getId(),
                t.getProductoFitosanitario().getNombre(),
                t.getProductoFitosanitario().getPrincipioAct(),
                t.getGranjero().getUsername(),
                t.getCreatedAt(),
                t.getUpdatedAt(),
                null, // aliasAgric — no disponible en contexto granjero sin repo inventario
                null, // explotacionNombre
                null, // granjeroNombre
                t.getMotivoTratamiento(),
                t.getCodigoPlaga(),
                t.getTipoEquipo(),
                t.getNumRegistroIteaf(),
                t.getFechaIteaf(),
                t.getVolumenCaldo(),
                t.getNifAplicador(),
                t.getNumeroRopo(),
                t.getNivelCapacitacionRopo()
        );
    }
}
