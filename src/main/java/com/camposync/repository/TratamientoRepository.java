package com.camposync.repository;

import com.camposync.entity.Tratamiento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TratamientoRepository extends JpaRepository<Tratamiento, Long> {

    List<Tratamiento> findByParcela_Id(Long parcelaId);

    List<Tratamiento> findByGranjero_Id(Long granjeroId);
}
