package com.camposync.service;

import com.camposync.dto.InventarioCreateRequest;
import com.camposync.dto.InventarioDTO;
import com.camposync.entity.Granjero;
import com.camposync.entity.Inventario;
import com.camposync.entity.ProductoFitosanitario;
import com.camposync.exception.ResourceNotFoundException;
import com.camposync.repository.GranjeroRepository;
import com.camposync.repository.InventarioRepository;
import com.camposync.repository.ProductoFitosanitarioRepository;
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
    private final ProductoFitosanitarioRepository productoRepository;

    public List<InventarioDTO> listarPorGranjero(String username) {
        Granjero granjero = granjeroRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Granjero", username));

        return inventarioRepository.findByGranjero_Id(granjero.getId())
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public InventarioDTO crear(String username, InventarioCreateRequest req) {
        Granjero granjero = granjeroRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Granjero", username));

        ProductoFitosanitario producto = productoRepository.findById(req.productoFitoId())
                .orElseThrow(() -> new ResourceNotFoundException("ProductoFitosanitario", req.productoFitoId()));

        // Upsert: if same product already in inventory, add to existing stock
        Inventario item = inventarioRepository
                .findByGranjero_IdAndProductoFitosanitario_Id(granjero.getId(), producto.getId())
                .map(existing -> {
                    existing.setStockAct(existing.getStockAct() + req.stockAct());
                    if (req.aliasAgric() != null && !req.aliasAgric().isBlank()) {
                        existing.setAliasAgric(req.aliasAgric());
                    }
                    return existing;
                })
                .orElseGet(() -> Inventario.builder()
                        .granjero(granjero)
                        .productoFitosanitario(producto)
                        .stockAct(req.stockAct())
                        .aliasAgric(req.aliasAgric())
                        .build());

        return toDTO(inventarioRepository.save(item));
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
