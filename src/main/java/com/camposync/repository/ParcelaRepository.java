package com.camposync.repository;

import com.camposync.entity.Parcela;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ParcelaRepository extends JpaRepository<Parcela, Long> {

    List<Parcela> findByExplotacion_Id(Long explotacionId);
}
