package com.camposync.service;

import com.camposync.entity.Asesor;
import com.camposync.entity.Asesoria;
import com.camposync.entity.Granjero;
import com.camposync.exception.ResourceNotFoundException;
import com.camposync.repository.AsesorRepository;
import com.camposync.repository.AsesoriaRepository;
import com.camposync.repository.GranjeroRepository;
import com.camposync.repository.UsuarioRepository;
import com.camposync.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final AsesorRepository asesorRepository;
    private final GranjeroRepository granjeroRepository;
    private final AsesoriaRepository asesoriaRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public String login(String username, String password) {
        var auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
        );
        return jwtService.generateToken((UserDetails) auth.getPrincipal());
    }

    @Transactional
    public void registerAsesor(String username, String rawPassword, Long asesoriaId, boolean esJefe) {
        if (usuarioRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("El username ya está en uso: " + username);
        }

        Asesoria asesoria = asesoriaRepository.findById(asesoriaId)
                .orElseThrow(() -> new ResourceNotFoundException("Asesoría", asesoriaId));

        Asesor asesor = Asesor.builder()
                .username(username)
                .passwd(passwordEncoder.encode(rawPassword))
                .asesoria(asesoria)
                .esJefe(esJefe)
                .build();

        asesorRepository.save(asesor);
    }

    @Transactional
    public void registerGranjero(String username, String rawPassword, String numLeg) {
        if (usuarioRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("El username ya está en uso: " + username);
        }

        Granjero granjero = Granjero.builder()
                .username(username)
                .passwd(passwordEncoder.encode(rawPassword))
                .numLeg(numLeg)
                .build();

        granjeroRepository.save(granjero);
    }
}
