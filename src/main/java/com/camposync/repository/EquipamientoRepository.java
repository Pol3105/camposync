package com.camposync.repository;

import com.camposync.entity.Equipamiento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipamientoRepository extends JpaRepository<Equipamiento, Long> {

    List<Equipamiento> findByGranjero_Id(Long granjeroId);
}
