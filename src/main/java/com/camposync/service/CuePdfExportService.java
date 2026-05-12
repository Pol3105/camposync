package com.camposync.service;

import com.camposync.entity.*;
import com.camposync.repository.ExplotacionRepository;
import lombok.RequiredArgsConstructor;
import org.docx4j.Docx4J;
import org.docx4j.convert.out.FOSettings;
import org.docx4j.openpackaging.packages.WordprocessingMLPackage;
import org.docx4j.wml.*;
import org.docx4j.fonts.IdentityPlusMapper;
import org.docx4j.fonts.Mapper;
import org.docx4j.fonts.PhysicalFonts;

import org.jvnet.jaxb2_commons.ppp.Child;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import jakarta.xml.bind.JAXBElement;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

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
            InputStream templateIs = new ClassPathResource("templates/2026_modelo_cuaderno_explotacion_v19.docx").getInputStream();
            WordprocessingMLPackage wordMLPackage = WordprocessingMLPackage.load(templateIs);

            HashMap<String, String> mappings = new HashMap<>();

            Granjero granjero = explotacion.getGranjero();
            mappings.put("titular", granjero != null && granjero.getNombreLegal() != null ? granjero.getNombreLegal() : "");
            mappings.put("nif", granjero != null && granjero.getNif() != null ? granjero.getNif() : "");
            mappings.put("regepa", explotacion.getCodigoRea() != null ? explotacion.getCodigoRea() : "");
            mappings.put("provincia", explotacion.getProvinciaExplotacion() != null ? explotacion.getProvinciaExplotacion() : "");
            mappings.put("municipio", explotacion.getMunicipioExplotacion() != null ? explotacion.getMunicipioExplotacion() : "");
            mappings.put("telefono", granjero != null && granjero.getTelefono() != null ? granjero.getTelefono() : "");
            mappings.put("email", granjero != null ? granjero.getUsername() : "");

            Asesoria asesoria = explotacion.getAsesoria();
            mappings.put("asesor_nombre", asesoria != null && asesoria.getNombre() != null ? asesoria.getNombre() : "");
            mappings.put("ropo_asesor", "");

            org.docx4j.model.datastorage.migration.VariablePrepare.prepare(wordMLPackage);
            wordMLPackage.getMainDocumentPart().variableReplace(mappings);

            // Fetch data for tables
            List<Aplicador> aplicadores = aplicadorRepository.findByGranjero_Id(granjero != null ? granjero.getId() : -1L);
            List<Equipamiento> equipos = equipamientoRepository.findByGranjero_Id(granjero != null ? granjero.getId() : -1L);
            List<Parcela> parcelas = parcelaRepository.findByExplotacion_Id(explotacionId);

            // Map data to replace standard row templates if present
            // We do a simple replacement for the first item if there are placeholders in the tables.
            // If the user's template just has variables, this will replace them.
            // If they need dynamic rows, a much more complex traversal is required.
            // The instructions specifically said: "sustitución... placeholders... convert ese documento".
            HashMap<String, String> tableMappings = new HashMap<>();

            if (parcelas != null && !parcelas.isEmpty()) {
                Parcela p1 = parcelas.get(0);
                tableMappings.put("p_provincia", p1.getProvincia() != null ? p1.getProvincia() : "");
                tableMappings.put("p_municipio", p1.getMunicipio() != null ? p1.getMunicipio() : "");
                tableMappings.put("p_poligono", p1.getPoligono() != null ? String.valueOf(p1.getPoligono()) : "");
                tableMappings.put("p_parcela", p1.getParcelaSigpac() != null ? String.valueOf(p1.getParcelaSigpac()) : "");

                List<Recinto> recintos = recintoRepository.findByParcela_Id(p1.getId());
                if (recintos != null && !recintos.isEmpty()) {
                    Recinto r1 = recintos.get(0);
                    tableMappings.put("r_superficie", r1.getSuperficie() != null ? r1.getSuperficie().toString() : "");
                    tableMappings.put("r_cultivo", r1.getCultivo() != null ? r1.getCultivo() : "");

                    List<Tratamiento> tratamientos = tratamientoRepository.findByRecinto_Id(r1.getId());
                    if (tratamientos != null && !tratamientos.isEmpty()) {
                        Tratamiento t1 = tratamientos.get(0);
                        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                        tableMappings.put("t_fecha", t1.getFecha() != null ? t1.getFecha().format(dtf) : "");
                        tableMappings.put("t_plaga", t1.getCodigoPlaga() != null ? t1.getCodigoPlaga() : "");
                        tableMappings.put("t_dosis", t1.getDosis() > 0 ? String.valueOf(t1.getDosis()) : "");
                        tableMappings.put("t_justificacion", t1.getMotivoTratamiento() != null ? t1.getMotivoTratamiento() : "");

                        if (t1.getProductoFitosanitario() != null) {
                            tableMappings.put("t_producto", t1.getProductoFitosanitario().getNombre());
                            tableMappings.put("t_registro", t1.getProductoFitosanitario().getNumReg());
                        }
                    }
                }
            }

            if (aplicadores != null && !aplicadores.isEmpty()) {
                Aplicador a1 = aplicadores.get(0);
                tableMappings.put("ap_nombre", a1.getNombre());
                tableMappings.put("ap_nif", a1.getNif());
                tableMappings.put("ap_ropo", a1.getNumeroRopo() != null ? a1.getNumeroRopo() : "");
            }

            if (equipos != null && !equipos.isEmpty()) {
                Equipamiento e1 = equipos.get(0);
                tableMappings.put("eq_tipo", e1.getTipoMaquina() != null ? e1.getTipoMaquina() : "");
                tableMappings.put("eq_marca", e1.getMarcaModelo() != null ? e1.getMarcaModelo() : "");
                tableMappings.put("eq_roma", e1.getAlias() != null ? e1.getAlias() : "");
                tableMappings.put("eq_iteaf", e1.getNumRegistroIteaf() != null ? e1.getNumRegistroIteaf() : "");
            }

            wordMLPackage.getMainDocumentPart().variableReplace(tableMappings);

            // Set up Font Mapper to avoid 'Symbol is not mapped to a physical font'
            Mapper fontMapper = new IdentityPlusMapper();

            // Map Calibri and Liberation Serif to Arial/Helvetica to avoid WARN and FOP issues
            org.docx4j.fonts.PhysicalFont arialFont = PhysicalFonts.get("Arial");
            if (arialFont == null) {
                arialFont = PhysicalFonts.get("Helvetica");
            }
            if (arialFont != null) {
                fontMapper.put("Calibri", arialFont);
                fontMapper.put("Liberation Serif", arialFont);
            }

            wordMLPackage.setFontMapper(fontMapper);
            PhysicalFonts.discoverPhysicalFonts();

            if (wordMLPackage.getMainDocumentPart().getStyleDefinitionsPart() != null &&
                wordMLPackage.getMainDocumentPart().getStyleDefinitionsPart().getDefaultParagraphStyle() == null) {
                // Ensure default paragraph style exists
                org.docx4j.wml.Style normal = new org.docx4j.wml.ObjectFactory().createStyle();
                normal.setType("paragraph");
                normal.setDefault(true);
                normal.setStyleId("Normal");
                org.docx4j.wml.Style.Name name = new org.docx4j.wml.Style.Name();
                name.setVal("Normal");
                normal.setName(name);
                wordMLPackage.getMainDocumentPart().getStyleDefinitionsPart().getContents().getStyle().add(normal);
            }





            ByteArrayOutputStream out = new ByteArrayOutputStream();

            String fopConfigXml = "<?xml version=\"1.0\" encoding=\"utf-8\"?><fop version=\"1.0\"><strict-configuration>true</strict-configuration><renderers><renderer mime=\"application/pdf\"><fonts><auto-detect/></fonts></renderer></renderers></fop>";
            org.docx4j.convert.out.fopconf.Fop fopConfig = null;
            try {
                jakarta.xml.bind.JAXBContext jc = jakarta.xml.bind.JAXBContext.newInstance(org.docx4j.convert.out.fopconf.ObjectFactory.class);
                jakarta.xml.bind.Unmarshaller u = jc.createUnmarshaller();
                fopConfig = (org.docx4j.convert.out.fopconf.Fop) u.unmarshal(new java.io.ByteArrayInputStream(fopConfigXml.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
            } catch (Exception ex) {
                ex.printStackTrace();
            }

            FOSettings foSettings = Docx4J.createFOSettings();
            foSettings.setWmlPackage(wordMLPackage);
            if (fopConfig != null) {
                foSettings.setFopConfig(fopConfig);
                System.out.println("FOP Config successfully initialized via Unmarshaller.");
            } else {
                System.err.println("FOP Config is NULL!");
            }

            try {
                Docx4J.toFO(foSettings, out, Docx4J.FLAG_EXPORT_PREFER_XSL);
            } catch (Exception fopEx) {
                System.err.println("FOP Exception details: ");
                fopEx.printStackTrace();
                throw new RuntimeException("Error rendering FO to PDF: " + fopEx.getMessage(), fopEx);
            }

            return out.toByteArray();
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error generando PDF CUE mediante plantilla DOCX: " + e.getMessage(), e);
        }
    }
}