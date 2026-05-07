package com.camposync.repository;

import com.camposync.entity.Aplicador;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AplicadorRepository extends JpaRepository<Aplicador, Long> {

    List<Aplicador> findByGranjero_Id(Long granjeroId);
}
