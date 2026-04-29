package com.camposync.repository;

import com.camposync.entity.Explotacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExplotacionRepository extends JpaRepository<Explotacion, Long> {

    List<Explotacion> findByAsesoria_Id(Long asesoriaId);

    List<Explotacion> findByGranjero_Id(Long granjeroId);
}
