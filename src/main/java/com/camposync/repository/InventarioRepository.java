package com.camposync.repository;

import com.camposync.entity.Inventario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InventarioRepository extends JpaRepository<Inventario, Long> {

    List<Inventario> findByGranjero_Id(Long granjeroId);

    Optional<Inventario> findByGranjero_IdAndProductoFitosanitario_Id(Long granjeroId, Long productoId);
}
