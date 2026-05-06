package com.camposync.repository;

import com.camposync.entity.PasswordResetToken;
import com.camposync.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    void deleteAllByUsuario(Usuario usuario);
}
