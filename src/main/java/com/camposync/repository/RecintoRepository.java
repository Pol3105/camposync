package com.camposync.repository;

import com.camposync.entity.Recinto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecintoRepository extends JpaRepository<Recinto, Long> {
    List<Recinto> findByParcela_Id(Long parcelaId);
    List<Recinto> findByParcela_Explotacion_Id(Long explotacionId);
    List<Recinto> findByParcela_Explotacion_Asesoria_Id(Long asesoriaId);
}
