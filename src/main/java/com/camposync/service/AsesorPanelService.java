package com.camposync.service;

import com.camposync.dto.ActualizarPerfilRequest;
import com.camposync.dto.AsesorRecintoCreateRequest;
import com.camposync.dto.AsesorDTO;
import com.camposync.dto.AsesorExplotacionCreateRequest;
import com.camposync.dto.AsesorParcelaCreateRequest;
import com.camposync.dto.ExplotacionDTO;
import com.camposync.dto.GranjeroDTO;
import com.camposync.dto.InvitacionDTO;
import com.camposync.dto.ParcelaDTO;
import com.camposync.dto.RecintoDTO;
import com.camposync.dto.TratamientoDTO;
import com.camposync.dto.TratamientoValidarRequest;
import com.camposync.entity.Asesor;
import com.camposync.entity.Asesoria;
import com.camposync.repository.AsesoriaRepository;
import com.camposync.entity.Explotacion;
import com.camposync.entity.Granjero;
import com.camposync.entity.Invitacion;
import com.camposync.entity.Parcela;
import com.camposync.entity.Recinto;
import com.camposync.entity.Tratamiento;
import com.camposync.exception.ResourceNotFoundException;
import com.camposync.repository.AsesorRepository;
import com.camposync.repository.ExplotacionRepository;
import com.camposync.repository.GranjeroRepository;
import com.camposync.repository.InvitacionRepository;
import com.camposync.repository.InventarioRepository;
import com.camposync.repository.ParcelaRepository;
import com.camposync.repository.RecintoRepository;
import com.camposync.repository.TratamientoRepository;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AsesorPanelService {

    private final AsesorRepository asesorRepository;
    private final AsesoriaRepository asesoriaRepository;
    private final GranjeroRepository granjeroRepository;
    private final ExplotacionRepository explotacionRepository;
    private final ParcelaRepository parcelaRepository;
    private final RecintoRepository recintoRepository;
    private final TratamientoRepository tratamientoRepository;
    private final InvitacionRepository invitacionRepository;
    private final InventarioRepository inventarioRepository;

    // ── Granjeros ─────────────────────────────────────────────────────────────

    public List<GranjeroDTO> listarGranjeros(String username) {
        Asesor asesor = getAsesor(username);
        return granjeroRepository.findByAsesoria_Id(asesor.getAsesoria().getId())
                .stream()
                .map(this::toGranjeroDTO)
                .toList();
    }

    // ── Explotaciones ─────────────────────────────────────────────────────────

    public List<ExplotacionDTO> listarExplotaciones(String username) {
        Asesor asesor = getAsesor(username);
        return explotacionRepository.findByAsesoria_Id(asesor.getAsesoria().getId())
                .stream()
                .map(this::toExplotacionDTO)
                .toList();
    }

    // ── Parcelas de una explotación ───────────────────────────────────────────

    public List<ParcelaDTO> listarParcelasDeExplotacion(String username, Long explotacionId) {
        Asesor asesor = getAsesor(username);
        Explotacion explotacion = explotacionRepository.findById(explotacionId)
                .orElseThrow(() -> new ResourceNotFoundException("Explotacion", explotacionId));

        if (!explotacion.getAsesoria().getId().equals(asesor.getAsesoria().getId())) {
            throw new ResourceNotFoundException("Explotacion", explotacionId);
        }

        return parcelaRepository.findByExplotacion_Id(explotacionId)
                .stream()
                .map(this::toParcelaDTO)
                .toList();
    }

    // ── Tratamientos (torre de control) ──────────────────────────────────────

    public List<TratamientoDTO> listarTratamientos(String username) {
        Asesor asesor = getAsesor(username);
        return tratamientoRepository
                .findByRecinto_Parcela_Explotacion_Asesoria_Id(asesor.getAsesoria().getId())
                .stream()
                .map(this::toTratamientoDTO)
                .toList();
    }

    // ── Explotaciones por granjero ────────────────────────────────────────────

    public List<ExplotacionDTO> listarExplotacionesPorGranjero(String username, Long granjeroId) {
        Asesor asesor = getAsesor(username);
        Granjero granjero = granjeroRepository.findById(granjeroId)
                .orElseThrow(() -> new ResourceNotFoundException("Granjero", granjeroId));

        if (!granjero.getAsesoria().getId().equals(asesor.getAsesoria().getId())) {
            throw new ResourceNotFoundException("Granjero", granjeroId);
        }

        return explotacionRepository.findByGranjero_Id(granjeroId)
                .stream()
                .map(this::toExplotacionDTO)
                .toList();
    }

    // ── Tratamientos por parcela ──────────────────────────────────────────────

    public List<TratamientoDTO> listarTratamientosPorParcela(String username, Long parcelaId) {
        Asesor asesor = getAsesor(username);
        Parcela parcela = parcelaRepository.findById(parcelaId)
                .orElseThrow(() -> new ResourceNotFoundException("Parcela", parcelaId));

        if (!parcela.getExplotacion().getAsesoria().getId().equals(asesor.getAsesoria().getId())) {
            throw new ResourceNotFoundException("Parcela", parcelaId);
        }

        return tratamientoRepository.findByRecinto_Parcela_Id(parcelaId)
                .stream()
                .map(this::toTratamientoDTO)
                .toList();
    }

    // ── Tratamientos por explotación ─────────────────────────────────────────

    public List<TratamientoDTO> listarTratamientosPorExplotacion(String username, Long explotacionId) {
        Asesor asesor = getAsesor(username);
        Explotacion explotacion = explotacionRepository.findById(explotacionId)
                .orElseThrow(() -> new ResourceNotFoundException("Explotacion", explotacionId));

        if (!explotacion.getAsesoria().getId().equals(asesor.getAsesoria().getId())) {
            throw new ResourceNotFoundException("Explotacion", explotacionId);
        }

        return tratamientoRepository
                .findByRecinto_Parcela_Explotacion_IdAndRecinto_Parcela_Explotacion_Asesoria_Id(
                        explotacionId, asesor.getAsesoria().getId())
                .stream()
                .map(this::toTratamientoDTO)
                .toList();
    }

    // ── Invitaciones ──────────────────────────────────────────────────────────

    public List<InvitacionDTO> listarInvitaciones(String username) {
        Asesor asesor = getAsesor(username);
        return invitacionRepository.findByAsesoria_Id(asesor.getAsesoria().getId())
                .stream()
                .map(this::toInvitacionDTO)
                .toList();
    }

    // ── Validación de tratamientos ────────────────────────────────────────────

    @Transactional
    public TratamientoDTO validarTratamiento(String username, Long tratamientoId,
                                             TratamientoValidarRequest request) {
        Asesor asesor = getAsesor(username);

        Tratamiento tratamiento = tratamientoRepository.findById(tratamientoId)
                .orElseThrow(() -> new ResourceNotFoundException("Tratamiento", tratamientoId));

        // Cadena de pertenencia: Tratamiento → Recinto → Parcela → Explotacion → Asesoria
        Long asesoriaDelTratamiento = tratamiento.getRecinto()
                .getParcela()
                .getExplotacion()
                .getAsesoria()
                .getId();

        if (!asesoriaDelTratamiento.equals(asesor.getAsesoria().getId())) {
            throw new ResourceNotFoundException("Tratamiento", tratamientoId);
        }

        tratamiento.setValidado(request.validado());
        tratamiento.setObservacionesValidador(request.observacionesValidador());

        return toTratamientoDTO(tratamientoRepository.save(tratamiento));
    }

    // ── Vinculación de explotaciones a granjero ───────────────────────────────

    @Transactional
    public void vincularExplotaciones(String username, Long granjeroId, List<Long> explotacionIds) {
        Asesor asesor = getAsesor(username);
        Granjero granjero = granjeroRepository.findById(granjeroId)
                .orElseThrow(() -> new ResourceNotFoundException("Granjero", granjeroId));

        if (!granjero.getAsesoria().getId().equals(asesor.getAsesoria().getId())) {
            throw new ResourceNotFoundException("Granjero", granjeroId);
        }

        for (Long explotId : explotacionIds) {
            explotacionRepository.findById(explotId).ifPresent(exp -> {
                if (exp.getAsesoria().getId().equals(asesor.getAsesoria().getId())) {
                    exp.setGranjero(granjero);
                    explotacionRepository.save(exp);
                }
            });
        }
    }

    // ── Crear explotación desde el panel del asesor ───────────────────────────

    @Transactional
    public ExplotacionDTO crearExplotacion(String username, AsesorExplotacionCreateRequest request) {
        Asesor asesor = getAsesor(username);
        Granjero granjero = granjeroRepository.findById(request.granjeroId())
                .orElseThrow(() -> new ResourceNotFoundException("Granjero", request.granjeroId()));

        if (!granjero.getAsesoria().getId().equals(asesor.getAsesoria().getId())) {
            throw new ResourceNotFoundException("Granjero", request.granjeroId());
        }

        Explotacion exp = Explotacion.builder()
                .nombre(request.nombre())
                .refSig(request.refSig())
                .superficieTotal(request.superficieTotal())
                .estado("ACTIVA")
                .codigoRea(request.codigoRea())
                .tipoExplotacion(request.tipoExplotacion())
                .orientacionProductiva(request.orientacionProductiva())
                .provinciaExplotacion(request.provinciaExplotacion())
                .municipioExplotacion(request.municipioExplotacion())
                .anioDeclaracion(request.anioDeclaracion())
                .asesoria(asesor.getAsesoria())
                .granjero(granjero)
                .build();

        return toExplotacionDTO(explotacionRepository.save(exp));
    }

    // ── Crear parcela desde el panel del asesor ───────────────────────────────

    @Transactional
    public ParcelaDTO crearParcela(String username, Long explotacionId, AsesorParcelaCreateRequest request) {
        Asesor asesor = getAsesor(username);
        Explotacion explotacion = explotacionRepository.findById(explotacionId)
                .orElseThrow(() -> new ResourceNotFoundException("Explotación", explotacionId));

        if (!explotacion.getAsesoria().getId().equals(asesor.getAsesoria().getId())) {
            throw new ResourceNotFoundException("Explotación", explotacionId);
        }

        Parcela parcela = Parcela.builder()
                .refCatastral(request.refCatastral())
                .municipio(request.municipio())
                .provincia(request.provincia())
                .agregado(request.agregado())
                .zona(request.zona())
                .poligono(request.poligono())
                .parcelaSigpac(request.parcelaSigpac())
                .explotacion(explotacion)
                .build();

        return toParcelaDTO(parcelaRepository.save(parcela));
    }

    // ── Editar explotación ────────────────────────────────────────────────────

    @Transactional
    public ExplotacionDTO editarExplotacion(String username, Long explotacionId, AsesorExplotacionCreateRequest request) {
        Asesor asesor = getAsesor(username);
        Explotacion exp = explotacionRepository.findById(explotacionId)
                .orElseThrow(() -> new ResourceNotFoundException("Explotacion", explotacionId));
        if (!exp.getAsesoria().getId().equals(asesor.getAsesoria().getId())) {
            throw new ResourceNotFoundException("Explotacion", explotacionId);
        }
        if (request.nombre()                != null) exp.setNombre(request.nombre());
        if (request.refSig()                != null) exp.setRefSig(request.refSig());
        if (request.superficieTotal()       != null) exp.setSuperficieTotal(request.superficieTotal());
        if (request.codigoRea()             != null) exp.setCodigoRea(request.codigoRea());
        if (request.tipoExplotacion()       != null) exp.setTipoExplotacion(request.tipoExplotacion());
        if (request.orientacionProductiva() != null) exp.setOrientacionProductiva(request.orientacionProductiva());
        if (request.provinciaExplotacion()  != null) exp.setProvinciaExplotacion(request.provinciaExplotacion());
        if (request.municipioExplotacion()  != null) exp.setMunicipioExplotacion(request.municipioExplotacion());
        if (request.anioDeclaracion()       != null) exp.setAnioDeclaracion(request.anioDeclaracion());
        if (request.granjeroId() != null) {
            granjeroRepository.findById(request.granjeroId())
                    .ifPresent(exp::setGranjero);
        }
        return toExplotacionDTO(explotacionRepository.save(exp));
    }

    @Transactional
    public void eliminarExplotacion(String username, Long explotacionId) {
        Asesor asesor = getAsesor(username);
        Explotacion exp = explotacionRepository.findById(explotacionId)
                .orElseThrow(() -> new ResourceNotFoundException("Explotacion", explotacionId));
        if (!exp.getAsesoria().getId().equals(asesor.getAsesoria().getId())) {
            throw new ResourceNotFoundException("Explotacion", explotacionId);
        }
        // Manual cascade: tratamientos → recintos → parcelas → explotación
        List<Parcela> parcelas = parcelaRepository.findByExplotacion_Id(explotacionId);
        for (Parcela p : parcelas) {
            List<Recinto> recintos = recintoRepository.findByParcela_Id(p.getId());
            for (Recinto r : recintos) {
                tratamientoRepository.deleteAll(tratamientoRepository.findByRecinto_Id(r.getId()));
            }
            recintoRepository.deleteAll(recintos);
        }
        parcelaRepository.deleteAll(parcelas);
        explotacionRepository.delete(exp);
    }

    // ── Editar parcela ────────────────────────────────────────────────────────

    @Transactional
    public ParcelaDTO editarParcela(String username, Long parcelaId, AsesorParcelaCreateRequest request) {
        Asesor asesor = getAsesor(username);
        Parcela parcela = parcelaRepository.findById(parcelaId)
                .orElseThrow(() -> new ResourceNotFoundException("Parcela", parcelaId));
        if (!parcela.getExplotacion().getAsesoria().getId().equals(asesor.getAsesoria().getId())) {
            throw new ResourceNotFoundException("Parcela", parcelaId);
        }
        parcela.setRefCatastral(request.refCatastral());
        parcela.setMunicipio(request.municipio());
        parcela.setProvincia(request.provincia());
        parcela.setAgregado(request.agregado());
        parcela.setZona(request.zona());
        parcela.setPoligono(request.poligono());
        parcela.setParcelaSigpac(request.parcelaSigpac());
        return toParcelaDTO(parcelaRepository.save(parcela));
    }

    @Transactional
    public void eliminarParcela(String username, Long parcelaId) {
        Asesor asesor = getAsesor(username);
        Parcela parcela = parcelaRepository.findById(parcelaId)
                .orElseThrow(() -> new ResourceNotFoundException("Parcela", parcelaId));
        if (!parcela.getExplotacion().getAsesoria().getId().equals(asesor.getAsesoria().getId())) {
            throw new ResourceNotFoundException("Parcela", parcelaId);
        }
        // Manual cascade: tratamientos → recintos → parcela
        List<Recinto> recintos = recintoRepository.findByParcela_Id(parcelaId);
        for (Recinto r : recintos) {
            tratamientoRepository.deleteAll(tratamientoRepository.findByRecinto_Id(r.getId()));
        }
        recintoRepository.deleteAll(recintos);
        parcelaRepository.delete(parcela);
    }

    // ── Editar recinto ────────────────────────────────────────────────────────

    @Transactional
    public RecintoDTO editarRecinto(String username, Long recintoId, AsesorRecintoCreateRequest request) {
        Asesor asesor = getAsesor(username);
        Recinto recinto = recintoRepository.findById(recintoId)
                .orElseThrow(() -> new ResourceNotFoundException("Recinto", recintoId));
        if (!recinto.getParcela().getExplotacion().getAsesoria().getId().equals(asesor.getAsesoria().getId())) {
            throw new ResourceNotFoundException("Recinto", recintoId);
        }
        recinto.setNumeroRecinto(request.numeroRecinto());
        recinto.setSuperficie(request.superficie());
        recinto.setUsoSigpac(request.usoSigpac());
        recinto.setSistemaCultivo(request.sistemaCultivo());
        recinto.setCultivo(request.cultivo());
        return toRecintoDTO(recintoRepository.save(recinto));
    }

    @Transactional
    public void eliminarRecinto(String username, Long recintoId) {
        Asesor asesor = getAsesor(username);
        Recinto recinto = recintoRepository.findById(recintoId)
                .orElseThrow(() -> new ResourceNotFoundException("Recinto", recintoId));
        if (!recinto.getParcela().getExplotacion().getAsesoria().getId().equals(asesor.getAsesoria().getId())) {
            throw new ResourceNotFoundException("Recinto", recintoId);
        }
        // Manual cascade: tratamientos → recinto
        tratamientoRepository.deleteAll(tratamientoRepository.findByRecinto_Id(recintoId));
        recintoRepository.delete(recinto);
    }

    // ── Crear recinto desde el panel del asesor ───────────────────────────────

    @Transactional
    public RecintoDTO crearRecinto(String username, Long parcelaId, AsesorRecintoCreateRequest request) {
        Asesor asesor = getAsesor(username);
        Parcela parcela = parcelaRepository.findById(parcelaId)
                .orElseThrow(() -> new ResourceNotFoundException("Parcela", parcelaId));

        if (!parcela.getExplotacion().getAsesoria().getId().equals(asesor.getAsesoria().getId())) {
            throw new ResourceNotFoundException("Parcela", parcelaId);
        }

        Recinto recinto = Recinto.builder()
                .numeroRecinto(request.numeroRecinto())
                .superficie(request.superficie())
                .usoSigpac(request.usoSigpac())
                .sistemaCultivo(request.sistemaCultivo())
                .cultivo(request.cultivo())
                .parcela(parcela)
                .build();

        return toRecintoDTO(recintoRepository.save(recinto));
    }

    // ── Recintos de una parcela ────────────────────────────────────────────────

    public List<RecintoDTO> listarRecintosPorParcela(String username, Long parcelaId) {
        Asesor asesor = getAsesor(username);
        Parcela parcela = parcelaRepository.findById(parcelaId)
                .orElseThrow(() -> new ResourceNotFoundException("Parcela", parcelaId));

        if (!parcela.getExplotacion().getAsesoria().getId().equals(asesor.getAsesoria().getId())) {
            throw new ResourceNotFoundException("Parcela", parcelaId);
        }

        return recintoRepository.findByParcela_Id(parcelaId)
                .stream()
                .map(this::toRecintoDTO)
                .toList();
    }

    // ── Tratamientos de un recinto ────────────────────────────────────────────

    public List<TratamientoDTO> listarTratamientosPorRecinto(String username, Long recintoId) {
        Asesor asesor = getAsesor(username);
        Recinto recinto = recintoRepository.findById(recintoId)
                .orElseThrow(() -> new ResourceNotFoundException("Recinto", recintoId));

        if (!recinto.getParcela().getExplotacion().getAsesoria().getId().equals(asesor.getAsesoria().getId())) {
            throw new ResourceNotFoundException("Recinto", recintoId);
        }

        return tratamientoRepository.findByRecinto_Id(recintoId)
                .stream()
                .map(this::toTratamientoDTO)
                .toList();
    }

    // ── Perfil ────────────────────────────────────────────────────────────────

    public AsesorDTO getPerfil(String username) {
        Asesor a = getAsesor(username);
        return toAsesorDTO(a);
    }

    @Transactional
    public AsesorDTO actualizarPerfil(String username, ActualizarPerfilRequest req) {
        Asesor a = getAsesor(username);
        if (req.nombre()      != null) a.setNombre(req.nombre());
        if (req.nif()         != null) a.setNif(req.nif());
        if (req.nombreLegal() != null) a.setNombreLegal(req.nombreLegal());
        a.setNumColegiado(req.numColegiado());
        if (a.isEsJefe()) {
            Asesoria asesoria = a.getAsesoria();
            asesoria.setTelefono(req.asesoriaTelefono());
            asesoria.setProvincia(req.asesoriaProvinciaAsesoria());
            asesoriaRepository.save(asesoria);
        }
        return toAsesorDTO(asesorRepository.save(a));
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private AsesorDTO toAsesorDTO(Asesor a) {
        return new AsesorDTO(
                a.getId(),
                a.getUsername(),
                a.getNombre(),
                a.getNif(),
                a.getNombreLegal(),
                a.getNumColegiado(),
                a.getAsesoria().getId(),
                a.getAsesoria().getNombre(),
                a.isEsJefe(),
                a.getAsesoria().getTelefono(),
                a.getAsesoria().getProvincia(),
                a.getCreatedAt()
        );
    }

    private Asesor getAsesor(String username) {
        return asesorRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Asesor", username));
    }

    private GranjeroDTO toGranjeroDTO(Granjero g) {
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

    private ExplotacionDTO toExplotacionDTO(Explotacion e) {
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

    private ParcelaDTO toParcelaDTO(Parcela p) {
        int numRecintos = recintoRepository.findByParcela_Id(p.getId()).size();
        return new ParcelaDTO(
                p.getId(),
                p.getRefCatastral(),
                p.getMunicipio(),
                p.getProvincia(),
                p.getAgregado(),
                p.getZona(),
                p.getPoligono(),
                p.getParcelaSigpac(),
                p.getExplotacion().getId(),
                p.getExplotacion().getNombre(),
                numRecintos,
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }

    private TratamientoDTO toTratamientoDTO(Tratamiento t) {
        String aliasAgric = inventarioRepository
                .findByGranjero_IdAndProductoFitosanitario_Id(
                        t.getGranjero().getId(),
                        t.getProductoFitosanitario().getId())
                .map(inv -> inv.getAliasAgric())
                .orElse(null);

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
                aliasAgric,
                t.getRecinto().getParcela().getExplotacion().getNombre(),
                t.getGranjero().getNombre(),
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

    private InvitacionDTO toInvitacionDTO(Invitacion i) {
        return new InvitacionDTO(
                i.getToken(),
                i.getEmailInvitado(),
                i.getEstado(),
                i.getExpiraEn(),
                i.getAsesoria().getId(),
                i.getAsesoria().getNombre(),
                i.getCreatedAt()
        );
    }

    private RecintoDTO toRecintoDTO(Recinto r) {
        return new RecintoDTO(
                r.getId(),
                r.getNumeroRecinto(),
                r.getSuperficie(),
                r.getUsoSigpac(),
                r.getSistemaCultivo(),
                r.getCultivo(),
                r.getParcela().getId(),
                r.getParcela().getRefCatastral(),
                r.getCreatedAt(),
                r.getUpdatedAt()
        );
    }
}
