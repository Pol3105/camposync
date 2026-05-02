package com.camposync.repository;

import com.camposync.entity.Tratamiento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TratamientoRepository extends JpaRepository<Tratamiento, Long> {

    List<Tratamiento> findByRecinto_Id(Long recintoId);

    List<Tratamiento> findByGranjero_Id(Long granjeroId);

    List<Tratamiento> findByRecinto_Parcela_Explotacion_Asesoria_Id(Long asesoriaId);

    List<Tratamiento> findByRecinto_Parcela_Explotacion_IdAndRecinto_Parcela_Explotacion_Asesoria_Id(
            Long explotacionId, Long asesoriaId);

    List<Tratamiento> findByRecinto_Parcela_Id(Long parcelaId);
}
