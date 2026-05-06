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
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InvitacionService {

    private final InvitacionRepository invitacionRepository;
    private final AsesorRepository asesorRepository;
    private final GranjeroRepository granjeroRepository;
    private final EmailService emailService;

    // ── Asesor: crea una invitación para un granjero ──────────────────────────

    @Transactional
    public InvitacionDTO crear(String username, InvitacionCreateRequest request) {
        var asesor = asesorRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Asesor", username));

        String rol = (request.rolDestino() != null && !request.rolDestino().isBlank())
                ? request.rolDestino().toUpperCase()
                : "AGRICULTOR";

        Invitacion invitacion = Invitacion.builder()
                .token(UUID.randomUUID().toString())
                .emailInvitado(request.emailInvitado())
                .rolDestino(rol)
                .estado(EstadoInvitacion.PENDIENTE)
                .expiraEn(LocalDateTime.now().plusDays(7))
                .asesoria(asesor.getAsesoria())
                .build();

        InvitacionDTO dto = toDTO(invitacionRepository.save(invitacion));

        // Envío de correo — fallo no revierte la transacción
        try {
            emailService.enviarCorreoInvitacion(request.emailInvitado(), invitacion.getToken(), rol);
        } catch (Exception e) {
            log.warn("Invitación guardada pero el correo no se pudo enviar a {}: {}", request.emailInvitado(), e.getMessage());
        }

        return dto;
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

    // ── Asesor: cancela una invitación pendiente ──────────────────────────────

    @Transactional
    public InvitacionDTO cancelar(String token, String username) {
        var asesor = asesorRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Asesor", username));
        Invitacion inv = invitacionRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invitación", token));
        if (!inv.getAsesoria().getId().equals(asesor.getAsesoria().getId())) {
            throw new ResourceNotFoundException("Invitación", token);
        }
        inv.setEstado(EstadoInvitacion.CANCELADA);
        return toDTO(invitacionRepository.save(inv));
    }

    // ── Asesor: reenvía (extiende) una invitación pendiente ──────────────────

    @Transactional
    public InvitacionDTO reenviar(String token, String username) {
        var asesor = asesorRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Asesor", username));
        Invitacion inv = invitacionRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invitación", token));
        if (!inv.getAsesoria().getId().equals(asesor.getAsesoria().getId())) {
            throw new ResourceNotFoundException("Invitación", token);
        }
        inv.setExpiraEn(LocalDateTime.now().plusDays(7));
        inv.setEstado(EstadoInvitacion.PENDIENTE);
        return toDTO(invitacionRepository.save(inv));
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
                i.getCreatedAt(),
                i.getRolDestino()
        );
    }
}
