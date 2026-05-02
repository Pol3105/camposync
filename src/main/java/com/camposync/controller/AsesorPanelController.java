package com.camposync.controller;

import com.camposync.dto.AsesorExplotacionCreateRequest;
import com.camposync.dto.AsesorParcelaCreateRequest;
import com.camposync.dto.ExplotacionDTO;
import com.camposync.dto.GranjeroDTO;
import com.camposync.dto.InvitacionDTO;
import com.camposync.dto.ParcelaDTO;
import com.camposync.dto.RecintoDTO;
import com.camposync.dto.TratamientoDTO;
import com.camposync.dto.TratamientoValidarRequest;
import com.camposync.service.AsesorPanelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/asesor")
@RequiredArgsConstructor
public class AsesorPanelController {

    private final AsesorPanelService asesorPanelService;

    @GetMapping("/granjeros")
    public ResponseEntity<List<GranjeroDTO>> listarGranjeros() {
        return ResponseEntity.ok(asesorPanelService.listarGranjeros(currentUsername()));
    }

    @GetMapping("/explotaciones")
    public ResponseEntity<List<ExplotacionDTO>> listarExplotaciones() {
        return ResponseEntity.ok(asesorPanelService.listarExplotaciones(currentUsername()));
    }

    @GetMapping("/explotaciones/{id}/parcelas")
    public ResponseEntity<List<ParcelaDTO>> listarParcelasDeExplotacion(@PathVariable Long id) {
        return ResponseEntity.ok(asesorPanelService.listarParcelasDeExplotacion(currentUsername(), id));
    }

    @GetMapping("/tratamientos")
    public ResponseEntity<List<TratamientoDTO>> listarTratamientos() {
        return ResponseEntity.ok(asesorPanelService.listarTratamientos(currentUsername()));
    }

    @GetMapping("/explotaciones/{id}/tratamientos")
    public ResponseEntity<List<TratamientoDTO>> listarTratamientosPorExplotacion(@PathVariable Long id) {
        return ResponseEntity.ok(asesorPanelService.listarTratamientosPorExplotacion(currentUsername(), id));
    }

    @GetMapping("/granjeros/{id}/explotaciones")
    public ResponseEntity<List<ExplotacionDTO>> listarExplotacionesPorGranjero(@PathVariable Long id) {
        return ResponseEntity.ok(asesorPanelService.listarExplotacionesPorGranjero(currentUsername(), id));
    }

    @GetMapping("/parcelas/{id}/tratamientos")
    public ResponseEntity<List<TratamientoDTO>> listarTratamientosPorParcela(@PathVariable Long id) {
        return ResponseEntity.ok(asesorPanelService.listarTratamientosPorParcela(currentUsername(), id));
    }

    @GetMapping("/parcelas/{id}/recintos")
    public ResponseEntity<List<RecintoDTO>> listarRecintosPorParcela(@PathVariable Long id) {
        return ResponseEntity.ok(asesorPanelService.listarRecintosPorParcela(currentUsername(), id));
    }

    @GetMapping("/recintos/{id}/tratamientos")
    public ResponseEntity<List<TratamientoDTO>> listarTratamientosPorRecinto(@PathVariable Long id) {
        return ResponseEntity.ok(asesorPanelService.listarTratamientosPorRecinto(currentUsername(), id));
    }

    @GetMapping("/invitaciones")
    public ResponseEntity<List<InvitacionDTO>> listarInvitaciones() {
        return ResponseEntity.ok(asesorPanelService.listarInvitaciones(currentUsername()));
    }

    @PatchMapping("/tratamientos/{id}/validar")
    public ResponseEntity<TratamientoDTO> validarTratamiento(
            @PathVariable Long id,
            @Valid @RequestBody TratamientoValidarRequest request) {
        return ResponseEntity.ok(asesorPanelService.validarTratamiento(currentUsername(), id, request));
    }

    @PutMapping("/granjeros/{id}/explotaciones")
    public ResponseEntity<Void> vincularExplotaciones(
            @PathVariable Long id,
            @RequestBody List<Long> explotacionIds) {
        asesorPanelService.vincularExplotaciones(currentUsername(), id, explotacionIds);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/explotaciones")
    public ResponseEntity<ExplotacionDTO> crearExplotacion(
            @Valid @RequestBody AsesorExplotacionCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(asesorPanelService.crearExplotacion(currentUsername(), request));
    }

    @PostMapping("/explotaciones/{id}/parcelas")
    public ResponseEntity<ParcelaDTO> crearParcela(
            @PathVariable Long id,
            @RequestBody AsesorParcelaCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(asesorPanelService.crearParcela(currentUsername(), id, request));
    }

    private String currentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
