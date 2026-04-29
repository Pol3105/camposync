package com.camposync.repository;

import com.camposync.entity.Inventario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InventarioRepository extends JpaRepository<Inventario, Long> {

    List<Inventario> findByGranjero_Id(Long granjeroId);
}
