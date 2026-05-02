package com.camposync.repository;

import com.camposync.entity.Granjero;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GranjeroRepository extends JpaRepository<Granjero, Long> {

    Optional<Granjero> findByUsername(String username);

    Optional<Granjero> findByCnae(String cnae);

    List<Granjero> findByAsesoria_Id(Long asesoriaId);
}
