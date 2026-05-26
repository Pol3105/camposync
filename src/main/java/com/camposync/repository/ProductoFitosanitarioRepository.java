package com.camposync.repository;

import com.camposync.entity.ProductoFitosanitario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductoFitosanitarioRepository extends JpaRepository<ProductoFitosanitario, Long> {

    Optional<ProductoFitosanitario> findByNumReg(String numReg);

    List<ProductoFitosanitario> findByActivoTrue();

    @org.springframework.data.jpa.repository.Query("SELECT p FROM ProductoFitosanitario p " +
            "WHERE p.activo = true AND (" +
            "  LOWER(p.nombre) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "  LOWER(p.principioAct) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "  LOWER(p.cultivosAutori) LIKE LOWER(CONCAT('%', :query, '%'))" +
            ") " +
            "ORDER BY p.nombre ASC")
    List<ProductoFitosanitario> searchActiveProducts(@org.springframework.data.repository.query.Param("query") String query);
}
