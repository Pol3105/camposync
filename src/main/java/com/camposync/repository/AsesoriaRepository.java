package com.camposync.repository;

import com.camposync.entity.Asesoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AsesoriaRepository extends JpaRepository<Asesoria, Long> {

    Optional<Asesoria> findByEmail(String email);

    boolean existsByEmail(String email);
}
