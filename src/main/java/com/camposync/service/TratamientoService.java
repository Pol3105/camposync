package com.camposync.service;

import com.camposync.dto.TratamientoCreateRequest;
import com.camposync.dto.TratamientoDTO;
import com.camposync.dto.TratamientoUpdateRequest;
import com.camposync.entity.Aplicador;
import com.camposync.entity.Equipamiento;
import com.camposync.entity.Granjero;
import com.camposync.entity.Inventario;
import com.camposync.entity.Recinto;
import com.camposync.entity.ProductoFitosanitario;
import com.camposync.entity.Tratamiento;
import com.camposync.exception.ResourceNotFoundException;
import com.camposync.repository.AplicadorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.camposync.repository.EquipamientoRepository;
import com.camposync.repository.GranjeroRepository;
import com.camposync.repository.InventarioRepository;
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
    private final AplicadorRepository aplicadorRepository;
    private final EquipamientoRepository equipamientoRepository;
    private final InventarioRepository inventarioRepository;

    @Transactional
    public TratamientoDTO crear(String username, TratamientoCreateRequest request) {
        Granjero granjero = getGranjero(username);
        Recinto recinto = getRecintoDelGranjero(request.recintoId(), granjero);

        ProductoFitosanitario producto = productoRepository.findById(request.productoFitosanitarioId())
                .orElseThrow(() -> new ResourceNotFoundException("ProductoFitosanitario", request.productoFitosanitarioId()));

        Aplicador aplicador = request.aplicadorId() != null
                ? aplicadorRepository.findById(request.aplicadorId())
                        .orElseThrow(() -> new ResourceNotFoundException("Aplicador", request.aplicadorId()))
                : null;

        Equipamiento equipamiento = request.equipamientoId() != null
                ? equipamientoRepository.findById(request.equipamientoId())
                        .orElseThrow(() -> new ResourceNotFoundException("Equipamiento", request.equipamientoId()))
                : null;

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
                .volumenCaldo(request.volumenCaldo())
                .aplicador(aplicador)
                .equipamiento(equipamiento)
                .recinto(recinto)
                .granjero(granjero)
                .productoFitosanitario(producto)
                .build();

        Tratamiento saved = tratamientoRepository.save(tratamiento);

        // Descontar stock del inventario
        float cantidadGastada = request.dosis() * request.superficieTratada().floatValue();
        inventarioRepository
                .findByGranjero_IdAndProductoFitosanitario_Id(granjero.getId(), producto.getId())
                .ifPresent(inv -> {
                    float nuevoStock = inv.getStockAct() - cantidadGastada;
                    inv.setStockAct(nuevoStock <= 0.1f ? 0f : nuevoStock);
                    inventarioRepository.save(inv);
                });

        return toDTO(saved);
    }

    @Transactional
    public TratamientoDTO actualizar(String username, Long id, TratamientoUpdateRequest request) {
        Granjero granjero = getGranjero(username);

        Tratamiento tratamiento = tratamientoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tratamiento", id));

        if (!tratamiento.getGranjero().getId().equals(granjero.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso para editar este tratamiento.");
        }

        if ("VALIDADO".equals(tratamiento.getEstado())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se puede editar un tratamiento ya validado.");
        }

        // 5. Revert old stock
        float oldGasto = tratamiento.getDosis() * (float) tratamiento.getSuperficieTratada();
        inventarioRepository
                .findByGranjero_IdAndProductoFitosanitario_Id(
                        granjero.getId(), tratamiento.getProductoFitosanitario().getId())
                .ifPresent(inv -> {
                    inv.setStockAct(inv.getStockAct() + oldGasto);
                    inventarioRepository.save(inv);
                });

        // 6. Resolve new ProductoFitosanitario
        ProductoFitosanitario newProducto = productoRepository.findById(request.productoFitosanitarioId())
                .orElseThrow(() -> new ResourceNotFoundException("ProductoFitosanitario", request.productoFitosanitarioId()));

        // Validación de stock disponible (tras el revert del gasto anterior)
        float newGasto = request.dosis() * request.superficieTratada().floatValue();
        float stockDisponible = inventarioRepository
                .findByGranjero_IdAndProductoFitosanitario_Id(granjero.getId(), newProducto.getId())
                .map(Inventario::getStockAct)
                .orElse(0f);
        if (newGasto > stockDisponible + 0.001f) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Stock insuficiente. Necesitas " + String.format("%.2f", newGasto)
                    + " pero solo tienes " + String.format("%.2f", stockDisponible) + ".");
        }

        // 7. Resolve new Recinto and verify ownership
        Recinto newRecinto = getRecintoDelGranjero(request.recintoId(), granjero);

        // 8. Resolve optional Aplicador and Equipamiento
        Aplicador newAplicador = request.aplicadorId() != null
                ? aplicadorRepository.findById(request.aplicadorId())
                        .orElseThrow(() -> new ResourceNotFoundException("Aplicador", request.aplicadorId()))
                : null;

        Equipamiento newEquipamiento = request.equipamientoId() != null
                ? equipamientoRepository.findById(request.equipamientoId())
                        .orElseThrow(() -> new ResourceNotFoundException("Equipamiento", request.equipamientoId()))
                : null;

        // 9. Update fields
        tratamiento.setFecha(request.fecha());
        tratamiento.setTextoOriginal(request.textoOriginal());
        tratamiento.setDosis(request.dosis());
        tratamiento.setUnidades(request.unidades());
        tratamiento.setSuperficieTratada(request.superficieTratada());
        tratamiento.setPlagaObjetivo(request.plagaObjetivo());
        tratamiento.setMotivoTratamiento(request.motivoTratamiento());
        tratamiento.setCodigoPlaga(request.codigoPlaga());
        tratamiento.setVolumenCaldo(request.volumenCaldo());
        tratamiento.setAplicador(newAplicador);
        tratamiento.setEquipamiento(newEquipamiento);
        tratamiento.setRecinto(newRecinto);
        tratamiento.setProductoFitosanitario(newProducto);

        // 10. Save
        Tratamiento saved = tratamientoRepository.save(tratamiento);

        // 11. Apply new stock deduction
        inventarioRepository
                .findByGranjero_IdAndProductoFitosanitario_Id(granjero.getId(), newProducto.getId())
                .ifPresent(inv -> {
                    float nuevoStock = inv.getStockAct() - newGasto;
                    inv.setStockAct(nuevoStock <= 0.1f ? 0f : nuevoStock);
                    inventarioRepository.save(inv);
                });

        // 12. Return DTO
        return toDTO(saved);
    }

    public List<TratamientoDTO> listarPorGranjero(String username, String strategy) {
        Granjero granjero = getGranjero(username);
        List<Tratamiento> list;
        if ("join-fetch".equalsIgnoreCase(strategy)) {
            list = tratamientoRepository.findByGranjero_IdJoinFetch(granjero.getId());
        } else if ("entity-graph".equalsIgnoreCase(strategy)) {
            list = tratamientoRepository.findByGranjero_IdEntityGraph(granjero.getId());
        } else {
            list = tratamientoRepository.findByGranjero_Id(granjero.getId());
        }
        return list.stream()
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
                t.getRecinto().getParcela().getExplotacion().getId(),
                t.getProductoFitosanitario().getId(),
                t.getProductoFitosanitario().getNombre(),
                t.getProductoFitosanitario().getPrincipioAct(),
                t.getGranjero().getUsername(),
                t.getCreatedAt(),
                t.getUpdatedAt(),
                null, // aliasAgric — sin contexto de inventario aquí
                null, // explotacionNombre
                null, // granjeroNombre
                t.getMotivoTratamiento(),
                t.getCodigoPlaga(),
                t.getVolumenCaldo(),
                t.getAplicador() != null ? t.getAplicador().getId()      : null,
                t.getAplicador() != null ? t.getAplicador().getNombre()   : null,
                t.getEquipamiento() != null ? t.getEquipamiento().getId()    : null,
                t.getEquipamiento() != null ? t.getEquipamiento().getAlias() : null
        );
    }
}
