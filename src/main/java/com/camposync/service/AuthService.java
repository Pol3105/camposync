package com.camposync.service;

import com.camposync.dto.LoginResponse;
import com.camposync.entity.Asesor;
import com.camposync.entity.Asesoria;
import com.camposync.entity.Granjero;
import com.camposync.entity.Invitacion;
import com.camposync.entity.Invitacion.EstadoInvitacion;
import com.camposync.entity.PasswordResetToken;
import com.camposync.entity.Plan;
import com.camposync.exception.ResourceNotFoundException;
import com.camposync.repository.AsesorRepository;
import com.camposync.repository.AsesoriaRepository;
import com.camposync.repository.GranjeroRepository;
import com.camposync.repository.InvitacionRepository;
import com.camposync.repository.PasswordResetTokenRepository;
import com.camposync.repository.PlanRepository;
import com.camposync.repository.UsuarioRepository;
import com.camposync.security.JwtService;
import com.camposync.security.UsuarioPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository            usuarioRepository;
    private final AsesorRepository             asesorRepository;
    private final GranjeroRepository           granjeroRepository;
    private final AsesoriaRepository           asesoriaRepository;
    private final PlanRepository               planRepository;
    private final InvitacionRepository         invitacionRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService                 emailService;
    private final PasswordEncoder              passwordEncoder;
    private final JwtService                   jwtService;
    private final AuthenticationManager        authenticationManager;

    // ── Login ─────────────────────────────────────────────────────────────────

    public LoginResponse login(String username, String password) {
        try {
            var auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );
            UsuarioPrincipal principal = (UsuarioPrincipal) auth.getPrincipal();
            String token = jwtService.generateToken(principal);
            // Extract the first authority and strip the "ROLE_" prefix for the frontend
            String rol = principal.getAuthorities().stream()
                    .findFirst()
                    .map(a -> a.getAuthority().replace("ROLE_", ""))
                    .orElse("ASESOR");
            String nombre = principal.getUsuario().getNombre();
            return new LoginResponse(token, rol, nombre);
        } catch (AuthenticationException e) {
            // Prevent ExceptionTranslationFilter from swallowing this as 403.
            // Return a proper 401 instead.
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas");
        }
    }

    // ── Registro normal de Asesor ─────────────────────────────────────────────

    @Transactional
    public void registerAsesor(String username, String rawPassword, String nombre, Long asesoriaId, boolean esJefe) {
        if (usuarioRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("El username ya está en uso: " + username);
        }

        Asesoria asesoria = asesoriaRepository.findById(asesoriaId)
                .orElseThrow(() -> new ResourceNotFoundException("Asesoría", asesoriaId));

        Asesor asesor = Asesor.builder()
                .username(username)
                .passwd(passwordEncoder.encode(rawPassword))
                .nombre(nombre) // <--- ¡AÑADIDO AQUÍ!
                .asesoria(asesoria)
                .esJefe(esJefe)
                .build();

        asesorRepository.save(asesor);
    }

    // ── Registro público: crea Asesoría nueva + Asesor jefe en una transacción ─

    @Transactional
    public void registerNuevaAsesoria(String email, String rawPassword,
                                      String nombreAsesor, String nombreAsesoria) {
        if (usuarioRepository.existsByUsername(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El email ya está registrado");
        }

        Plan plan = planRepository.findByIsDefaultTrue()
                .orElseThrow(() -> new IllegalStateException("No existe ningún plan por defecto"));

        Asesoria asesoria = asesoriaRepository.save(Asesoria.builder()
                .nombre(nombreAsesoria)
                .email(email)
                .activo(true)
                .plan(plan)
                .build());

        Asesor asesor = Asesor.builder()
                .username(email)
                .passwd(passwordEncoder.encode(rawPassword))
                .nombre(nombreAsesor)
                .asesoria(asesoria)
                .esJefe(true)
                .build();

        asesorRepository.save(asesor);
    }

    // ── Registro normal de Granjero (sin invitación) ──────────────────────────

    @Transactional
    public void registerGranjero(String username, String rawPassword, String nombre, String cnae, Long asesoriaId) {
        if (usuarioRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("El username ya está en uso: " + username);
        }

        Asesoria asesoria = asesoriaRepository.findById(asesoriaId)
                .orElseThrow(() -> new ResourceNotFoundException("Asesoría", asesoriaId));

        Granjero granjero = Granjero.builder()
                .username(username)
                .passwd(passwordEncoder.encode(rawPassword))
                .nombre(nombre)
                .cnae(cnae)
                .asesoria(asesoria)
                .build();

        granjeroRepository.save(granjero);
    }

    // ── Recuperación de contraseña: paso 1 (solicitud) ───────────────────────

    @Transactional
    public void forgotPassword(String email) {
        usuarioRepository.findByUsername(email).ifPresent(usuario -> {
            // Invalida tokens anteriores
            passwordResetTokenRepository.deleteAllByUsuario(usuario);

            String token = UUID.randomUUID().toString();
            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .token(token)
                    .usuario(usuario)
                    .expiresAt(LocalDateTime.now().plusHours(1))
                    .build();
            passwordResetTokenRepository.save(resetToken);

            try {
                emailService.enviarCorreoRecuperacion(email, token);
            } catch (Exception e) {
                log.warn("Token de recuperación creado pero el correo falló para {}: {}", email, e.getMessage());
            }
        });
        // Si el usuario no existe, devolvemos OK igualmente (evita enumeración)
    }

    // ── Recuperación de contraseña: paso 2 (reseteo) ─────────────────────────

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Token de recuperación no válido"));

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            passwordResetTokenRepository.delete(resetToken);
            throw new ResponseStatusException(HttpStatus.GONE, "El token ha expirado");
        }

        var usuario = resetToken.getUsuario();
        usuario.setPasswd(passwordEncoder.encode(newPassword));
        usuarioRepository.save(usuario);

        passwordResetTokenRepository.delete(resetToken);
    }

    // ── Registro + aceptación de invitación en una sola transacción ───────────

    /**
     * Flujo atómico para el registro de un Granjero mediante token de invitación:
     * 1. Valida la invitación (existe, PENDIENTE, no expirada, email coincide).
     * 2. Crea el Granjero y lo vincula a la Asesoría de la invitación.
     * 3. Marca la invitación como ACEPTADA.
     * 4. Genera y devuelve un JWT listo para usar.
     * Si cualquier paso falla, la transacción hace rollback completo.
     */
    @Transactional
    public LoginResponse registerViaInvite(String token, String username,String nombre, String rawPassword) {

        // 1. Buscar la invitación
        Invitacion invitacion = invitacionRepository.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Invitación no encontrada"));

        // 2. Estado PENDIENTE
        if (invitacion.getEstado() != EstadoInvitacion.PENDIENTE) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "La invitación no está en estado PENDIENTE");
        }

        // 3. No expirada
        if (invitacion.getExpiraEn().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.GONE, "La invitación ha expirado");
        }

        // 4. El email del invitado debe coincidir con el username recibido
        if (!invitacion.getEmailInvitado().equalsIgnoreCase(username)) {
            throw new ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "El email no coincide con el de la invitación");
        }

        // 5. Username disponible
        if (usuarioRepository.existsByUsername(username)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "El email ya está registrado");
        }

        // 6. Crear usuario según rolDestino de la invitación
        String rolDestino = invitacion.getRolDestino();
        com.camposync.entity.Usuario nuevoUsuario;
        String rolRespuesta;

        if ("ASESOR".equalsIgnoreCase(rolDestino)) {
            Asesor asesor = Asesor.builder()
                    .username(username)
                    .nombre(nombre)
                    .passwd(passwordEncoder.encode(rawPassword))
                    .asesoria(invitacion.getAsesoria())
                    .esJefe(false)
                    .build();
            asesorRepository.save(asesor);
            nuevoUsuario = asesor;
            rolRespuesta = "ASESOR";
        } else {
            Granjero granjero = Granjero.builder()
                    .username(username)
                    .nombre(nombre)
                    .passwd(passwordEncoder.encode(rawPassword))
                    .asesoria(invitacion.getAsesoria())
                    .build();
            granjeroRepository.save(granjero);
            nuevoUsuario = granjero;
            rolRespuesta = "GRANJERO";
        }

        // 7. Marcar invitación como ACEPTADA
        invitacion.setEstado(EstadoInvitacion.ACEPTADA);
        invitacionRepository.save(invitacion);

        // 8. Generar JWT directamente (sin pasar por AuthenticationManager)
        String jwt = jwtService.generateToken(new UsuarioPrincipal(nuevoUsuario));
        return new LoginResponse(jwt, rolRespuesta, nuevoUsuario.getNombre());
    }
}
