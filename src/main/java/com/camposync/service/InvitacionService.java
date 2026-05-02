package com.camposync.service;

import com.camposync.dto.InvitacionCreateRequest;
import com.camposync.dto.InvitacionDTO;
import com.camposync.entity.Granjero;
import com.camposync.entity.Invitacion;
import com.camposync.entity.Invitacion.EstadoInvitacion;
import com.camposync.exception.ResourceNotFoundException;
import com.camposync.repository.AsesorRepository;
import com.camposync.repository.GranjeroRepository;
import com.camposync.repository.InvitacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InvitacionService {

    private final InvitacionRepository invitacionRepository;
    private final AsesorRepository asesorRepository;
    private final GranjeroRepository granjeroRepository;

    // ── Asesor: crea una invitación para un granjero ──────────────────────────

    @Transactional
    public InvitacionDTO crear(String username, InvitacionCreateRequest request) {
        var asesor = asesorRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Asesor", username));

        Invitacion invitacion = Invitacion.builder()
                .token(UUID.randomUUID().toString())
                .emailInvitado(request.emailInvitado())
                .estado(EstadoInvitacion.PENDIENTE)
                .expiraEn(LocalDateTime.now().plusDays(7))
                .asesoria(asesor.getAsesoria())
                .build();

        return toDTO(invitacionRepository.save(invitacion));
    }

    // ── Granjero: lista sus invitaciones pendientes ───────────────────────────

    public List<InvitacionDTO> listarMisInvitaciones(String username) {
        verificarGranjero(username);
        return invitacionRepository
                .findByEmailInvitadoAndEstado(username, EstadoInvitacion.PENDIENTE)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    // ── Granjero: acepta una invitación y queda vinculado a la Asesoría ───────

    @Transactional
    public InvitacionDTO aceptar(String token, String username) {
        Granjero granjero = verificarGranjero(username);

        Invitacion invitacion = invitacionRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invitación", token));

        if (!invitacion.getEmailInvitado().equals(username)) {
            throw new ResourceNotFoundException("Invitación", token);
        }
        if (invitacion.getEstado() != EstadoInvitacion.PENDIENTE) {
            throw new IllegalArgumentException("La invitación ya no está en estado PENDIENTE");
        }
        if (invitacion.getExpiraEn().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("La invitación ha expirado");
        }

        invitacion.setEstado(EstadoInvitacion.ACEPTADA);
        invitacionRepository.save(invitacion);

        // Vincula el granjero a la asesoría
        granjero.setAsesoria(invitacion.getAsesoria());
        granjeroRepository.save(granjero);

        return toDTO(invitacion);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private Granjero verificarGranjero(String username) {
        return granjeroRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Granjero", username));
    }

    private InvitacionDTO toDTO(Invitacion i) {
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
}
