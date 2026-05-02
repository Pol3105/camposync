package com.camposync.service;

import com.camposync.dto.RecintoDTO;
import com.camposync.entity.Granjero;
import com.camposync.entity.Parcela;
import com.camposync.entity.Recinto;
import com.camposync.exception.ResourceNotFoundException;
import com.camposync.repository.GranjeroRepository;
import com.camposync.repository.ParcelaRepository;
import com.camposync.repository.RecintoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecintoService {

    private final RecintoRepository recintoRepository;
    private final ParcelaRepository parcelaRepository;
    private final GranjeroRepository granjeroRepository;

    public List<RecintoDTO> listarPorParcela(Long parcelaId, String username) {
        Granjero granjero = granjeroRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Granjero", username));

        Parcela parcela = parcelaRepository.findById(parcelaId)
                .orElseThrow(() -> new ResourceNotFoundException("Parcela", parcelaId));

        if (!parcela.getExplotacion().getGranjero().getId().equals(granjero.getId())) {
            throw new ResourceNotFoundException("Parcela", parcelaId);
        }

        return recintoRepository.findByParcela_Id(parcelaId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    private RecintoDTO toDTO(Recinto r) {
        return new RecintoDTO(
                r.getId(),
                r.getNumeroRecinto(),
                r.getSuperficie(),
                r.getUsoSigpac(),
                r.getSistemaCultivo(),
                r.getCultivo(),
                r.getParcela().getId(),
                r.getParcela().getRefCatastral(),
                r.getCreatedAt(),
                r.getUpdatedAt()
        );
    }
}
