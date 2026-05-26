package com.camposync.repository;

import com.camposync.entity.Tratamiento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TratamientoRepository extends JpaRepository<Tratamiento, Long> {

    List<Tratamiento> findByRecinto_Id(Long recintoId);

    List<Tratamiento> findByGranjero_Id(Long granjeroId);

    @org.springframework.data.jpa.repository.Query("SELECT t FROM Tratamiento t " +
            "JOIN FETCH t.recinto r " +
            "JOIN FETCH r.parcela p " +
            "JOIN FETCH p.explotacion e " +
            "JOIN FETCH t.productoFitosanitario pf " +
            "JOIN FETCH t.granjero g " +
            "LEFT JOIN FETCH t.aplicador a " +
            "LEFT JOIN FETCH t.equipamiento eq " +
            "WHERE g.id = :granjeroId")
    List<Tratamiento> findByGranjero_IdJoinFetch(@org.springframework.data.repository.query.Param("granjeroId") Long granjeroId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {
            "recinto.parcela.explotacion",
            "productoFitosanitario",
            "granjero",
            "aplicador",
            "equipamiento"
    })
    @org.springframework.data.jpa.repository.Query("SELECT t FROM Tratamiento t WHERE t.granjero.id = :granjeroId")
    List<Tratamiento> findByGranjero_IdEntityGraph(@org.springframework.data.repository.query.Param("granjeroId") Long granjeroId);

    List<Tratamiento> findByRecinto_Parcela_Explotacion_Asesoria_Id(Long asesoriaId);

    List<Tratamiento> findByRecinto_Parcela_Explotacion_IdAndRecinto_Parcela_Explotacion_Asesoria_Id(
            Long explotacionId, Long asesoriaId);

    List<Tratamiento> findByRecinto_Parcela_Id(Long parcelaId);
}

