package com.camposync.repository;

import com.camposync.entity.Asesor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AsesorRepository extends JpaRepository<Asesor, Long> {

    List<Asesor> findByAsesoria_Id(Long asesoriaId);
}
