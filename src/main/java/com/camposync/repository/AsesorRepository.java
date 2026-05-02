package com.camposync.repository;

import com.camposync.entity.Asesor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AsesorRepository extends JpaRepository<Asesor, Long> {

    Optional<Asesor> findByUsername(String username);

    List<Asesor> findByAsesoria_Id(Long asesoriaId);
}
