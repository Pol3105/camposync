package com.camposync.repository;

import com.camposync.entity.ProductoFitosanitario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductoFitosanitarioRepository extends JpaRepository<ProductoFitosanitario, Long> {

    Optional<ProductoFitosanitario> findByNumReg(String numReg);

    List<ProductoFitosanitario> findByActivoTrue();
}
