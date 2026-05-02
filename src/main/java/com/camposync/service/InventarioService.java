package com.camposync.service;

import com.camposync.dto.InventarioDTO;
import com.camposync.entity.Granjero;
import com.camposync.entity.Inventario;
import com.camposync.exception.ResourceNotFoundException;
import com.camposync.repository.GranjeroRepository;
import com.camposync.repository.InventarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventarioService {

    private final InventarioRepository inventarioRepository;
    private final GranjeroRepository granjeroRepository;

    public List<InventarioDTO> listarPorGranjero(String username) {
        Granjero granjero = granjeroRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Granjero", username));

        return inventarioRepository.findByGranjero_Id(granjero.getId())
                .stream()
                .map(this::toDTO)
                .toList();
    }

    private InventarioDTO toDTO(Inventario i) {
        return new InventarioDTO(
                i.getId(),
                i.getAliasAgric(),
                i.getStockAct(),
                i.getProductoFitosanitario().getId(),
                i.getProductoFitosanitario().getNombre(),
                i.getProductoFitosanitario().getPrincipioAct()
        );
    }
}
