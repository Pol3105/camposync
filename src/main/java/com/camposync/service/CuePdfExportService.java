package com.camposync.service;

import com.camposync.entity.*;
import com.camposync.repository.ExplotacionRepository;
import lombok.RequiredArgsConstructor;
import org.docx4j.Docx4J;
import org.docx4j.convert.out.FOSettings;
import org.docx4j.openpackaging.packages.WordprocessingMLPackage;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CuePdfExportService {

    private final ExplotacionRepository explotacionRepository;
    private final com.camposync.repository.AplicadorRepository aplicadorRepository;
    private final com.camposync.repository.EquipamientoRepository equipamientoRepository;
    private final com.camposync.repository.ParcelaRepository parcelaRepository;
    private final com.camposync.repository.RecintoRepository recintoRepository;
    private final com.camposync.repository.TratamientoRepository tratamientoRepository;

    public byte[] generateCuePdf(Long explotacionId) {
        Explotacion explotacion = explotacionRepository.findById(explotacionId)
                .orElseThrow(() -> new RuntimeException("Explotacion no encontrada"));

        try {
            // Load template
            InputStream templateIs = new java.io.FileInputStream("templates/2026_modelo_cuaderno_explotacion_v19.docx");
            WordprocessingMLPackage wordMLPackage = WordprocessingMLPackage.load(templateIs);

            // Prepare mappings
            HashMap<String, String> mappings = new HashMap<>();

            Granjero granjero = explotacion.getGranjero();
            mappings.put("titular", granjero != null ? granjero.getNombreLegal() : "");
            mappings.put("nif", granjero != null ? granjero.getNif() : "");
            mappings.put("regepa", explotacion.getCodigoRea() != null ? explotacion.getCodigoRea() : "");
            mappings.put("provincia", explotacion.getProvinciaExplotacion() != null ? explotacion.getProvinciaExplotacion() : "");
            mappings.put("municipio", explotacion.getMunicipioExplotacion() != null ? explotacion.getMunicipioExplotacion() : "");
            mappings.put("telefono", granjero != null ? granjero.getTelefono() : "");
            mappings.put("email", granjero != null ? granjero.getUsername() : "");

            Asesoria asesoria = explotacion.getAsesoria();
            mappings.put("asesor_nombre", asesoria != null ? asesoria.getNombre() : "");

            // Apply mappings (Note: VariablePrepare helps fix fragmented variables, but basic mappings replaces them)
            org.docx4j.model.datastorage.migration.VariablePrepare.prepare(wordMLPackage);
            wordMLPackage.getMainDocumentPart().variableReplace(mappings);

            // Output to PDF
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            FOSettings foSettings = Docx4J.createFOSettings();
            foSettings.setWmlPackage(wordMLPackage);
            Docx4J.toFO(foSettings, out, Docx4J.FLAG_EXPORT_PREFER_XSL);

            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generando PDF CUE mediante plantilla DOCX", e);
        }
    }
}
