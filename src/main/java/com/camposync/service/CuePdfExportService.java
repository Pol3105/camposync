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

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.docx4j.XmlUtils;

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

            Granjero granjero = explotacion.getGranjero();
            Asesoria asesoria = explotacion.getAsesoria();

            // Extract tables
            List<Object> tables = wordMLPackage.getMainDocumentPart().getJAXBNodesViaXPath("//w:tbl", false);

            // Table 0: Titular
            if (tables.size() > 0) {
                Tbl tblTitular = (Tbl) tables.get(0);
                List<Object> rows = tblTitular.getContent();
                if (rows.size() > 7) {
                    fillCell((Tr) rows.get(1), 0, granjero != null && granjero.getNombreLegal() != null ? granjero.getNombreLegal() : "");
                    fillCell((Tr) rows.get(1), 1, granjero != null && granjero.getNif() != null ? granjero.getNif() : "");
                    fillCell((Tr) rows.get(3), 1, granjero != null && granjero.getTelefono() != null ? granjero.getTelefono() : "");
                    fillCell((Tr) rows.get(5), 0, explotacion.getMunicipioExplotacion() != null ? explotacion.getMunicipioExplotacion() : "");
                    fillCell((Tr) rows.get(5), 2, granjero != null ? granjero.getUsername() : "");
                }
            }

            // Table 1: Aplicadores
            List<Aplicador> aplicadores = aplicadorRepository.findByGranjero_Id(granjero != null ? granjero.getId() : -1L);
            if (tables.size() > 1 && aplicadores != null && !aplicadores.isEmpty()) {
                Tbl tbl = (Tbl) tables.get(1);
                List<Object> rows = tbl.getContent();
                if (rows.size() > 2) {
                    Tr templateRow = (Tr) rows.get(2);
                    tbl.getContent().remove(templateRow);
                    int idx = 1;
                    for (Aplicador a : aplicadores) {
                        Tr newRow = XmlUtils.deepCopy(templateRow);
                        fillCell(newRow, 0, String.valueOf(idx++));
                        fillCell(newRow, 1, a.getNombre() != null ? a.getNombre() : "");
                        fillCell(newRow, 2, a.getNif() != null ? a.getNif() : "");
                        fillCell(newRow, 3, a.getNumeroRopo() != null ? a.getNumeroRopo() : "");
                        String nivel = a.getNivelCapacitacion() != null ? a.getNivelCapacitacion() : "";
                        fillCell(newRow, 4, nivel.equalsIgnoreCase("BASICO") ? "X" : "");
                        fillCell(newRow, 5, nivel.equalsIgnoreCase("CUALIFICADO") ? "X" : "");
                        fillCell(newRow, 6, nivel.equalsIgnoreCase("FUMIGADOR") ? "X" : "");
                        tbl.getContent().add(newRow);
                    }
                }
            }

            // Table 2: Asesor
            if (tables.size() > 2) {
                Tbl tbl = (Tbl) tables.get(2);
                List<Object> rows = tbl.getContent();
                if (rows.size() > 2) {
                    fillCell((Tr) rows.get(2), 0, "1");
                    fillCell((Tr) rows.get(2), 1, asesoria != null && asesoria.getNombre() != null ? asesoria.getNombre() : "");
                }
            }

            // Table 8: Maquinaria
            List<Equipamiento> equipos = equipamientoRepository.findByGranjero_Id(granjero != null ? granjero.getId() : -1L);
            if (tables.size() > 8 && equipos != null && !equipos.isEmpty()) {
                Tbl tbl = (Tbl) tables.get(8);
                List<Object> rows = tbl.getContent();
                if (rows.size() > 1) {
                    Tr templateRow = (Tr) rows.get(1); // Row 1 is first empty
                    for(int k=rows.size()-1; k>=1; k--) tbl.getContent().remove(k); // remove all empty rows
                    int idx = 1;
                    for (Equipamiento e : equipos) {
                        Tr newRow = XmlUtils.deepCopy(templateRow);
                        fillCell(newRow, 0, String.valueOf(idx++));
                        fillCell(newRow, 1, e.getTipoMaquina() != null ? e.getTipoMaquina() : "");
                        fillCell(newRow, 2, e.getAlias() != null ? e.getAlias() : ""); // ROMA
                        fillCell(newRow, 3, "");
                        fillCell(newRow, 4, e.getNumRegistroIteaf() != null ? e.getNumRegistroIteaf() : "");
                        tbl.getContent().add(newRow);
                    }
                }
            }

            List<Parcela> parcelas = parcelaRepository.findByExplotacion_Id(explotacionId);
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");

            // Table 13: Parcelas
            if (tables.size() > 13 && parcelas != null && !parcelas.isEmpty()) {
                Tbl tbl = (Tbl) tables.get(13);
                List<Object> rows = tbl.getContent();
                if (rows.size() > 1) {
                    Tr templateRow = (Tr) rows.get(1);
                    for(int k=rows.size()-1; k>=1; k--) tbl.getContent().remove(k);

                    int idx = 1;
                    for (Parcela p : parcelas) {
                        List<Recinto> recintos = recintoRepository.findByParcela_Id(p.getId());
                        if (recintos != null) {
                            for (Recinto r : recintos) {
                                Tr newRow = XmlUtils.deepCopy(templateRow);
                                fillCell(newRow, 0, String.valueOf(idx++));
                                fillCell(newRow, 1, p.getProvincia() != null ? p.getProvincia() : "");
                                fillCell(newRow, 2, p.getMunicipio() != null ? p.getMunicipio() : "");
                                fillCell(newRow, 3, p.getAgregado() != null ? String.valueOf(p.getAgregado()) : "");
                                fillCell(newRow, 4, p.getZona() != null ? String.valueOf(p.getZona()) : "");
                                fillCell(newRow, 5, p.getPoligono() != null ? String.valueOf(p.getPoligono()) : "");
                                fillCell(newRow, 6, p.getParcelaSigpac() != null ? String.valueOf(p.getParcelaSigpac()) : "");
                                fillCell(newRow, 7, String.valueOf(r.getNumeroRecinto()));

                                String sup = r.getSuperficie() != null ? r.getSuperficie().setScale(4, RoundingMode.HALF_UP).toString() : "";
                                fillCell(newRow, 8, sup);
                                fillCell(newRow, 9, sup);
                                fillCell(newRow, 10, r.getCultivo() != null ? r.getCultivo() : "");
                                fillCell(newRow, 14, ""); // Sistema riego
                                fillCell(newRow, 15, r.getSistemaCultivo() != null ? r.getSistemaCultivo() : "");
                                tbl.getContent().add(newRow);
                            }
                        }
                    }
                }
            }

            // Table 14: Tratamientos
            if (tables.size() > 14 && parcelas != null && !parcelas.isEmpty()) {
                Tbl tbl = (Tbl) tables.get(14);
                List<Object> rows = tbl.getContent();
                if (rows.size() > 15) {
                    Tr templateRow = (Tr) rows.get(15);
                    for(int k=rows.size()-1; k>=15; k--) tbl.getContent().remove(k);

                    for (Parcela p : parcelas) {
                        List<Recinto> recintos = recintoRepository.findByParcela_Id(p.getId());
                        if (recintos != null) {
                            for (Recinto r : recintos) {
                                List<Tratamiento> tratamientos = tratamientoRepository.findByRecinto_Id(r.getId());
                                if (tratamientos != null) {
                                    for (Tratamiento t : tratamientos) {
                                        Tr newRow = XmlUtils.deepCopy(templateRow);
                                        fillCell(newRow, 0, t.getFecha() != null ? t.getFecha().format(dtf) : "");
                                        String idParcela = String.format("Pol %s Par %s Rec %d",
                                                p.getPoligono()!=null ? p.getPoligono() : "-",
                                                p.getParcelaSigpac()!=null ? p.getParcelaSigpac() : "-",
                                                r.getNumeroRecinto());
                                        fillCell(newRow, 1, idParcela);
                                        fillCell(newRow, 2, r.getSuperficie() != null ? r.getSuperficie().setScale(4, RoundingMode.HALF_UP).toString() : "");
                                        fillCell(newRow, 3, t.getCodigoPlaga() != null ? t.getCodigoPlaga() : "");

                                        Aplicador app = t.getAplicador();
                                        fillCell(newRow, 4, app != null ? app.getNombre() : "");
                                        fillCell(newRow, 6, t.getMotivoTratamiento() != null ? t.getMotivoTratamiento() : "");

                                        ProductoFitosanitario prod = t.getProductoFitosanitario();
                                        if (prod != null) {
                                            fillCell(newRow, 8, prod.getNombre());
                                            fillCell(newRow, 9, prod.getNumReg() != null ? prod.getNumReg() : "");
                                        }
                                        fillCell(newRow, 10, t.getDosis() > 0 ? String.valueOf(t.getDosis()) : "");
                                        fillCell(newRow, 13, "Buena");

                                        tbl.getContent().add(newRow);
                                    }
                                }
                            }
                        }
                    }
                }
            }


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
            org.docx4j.Docx4jProperties.setProperty("docx4j.convert.out.fop.FopFactoryBuilder.configuration", "fop-config.xml");

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

    private void fillCell(Tr row, int cellIndex, String text) {
        List<Object> cells = row.getContent();
        if (cells != null && cellIndex < cells.size()) {
            Tc cell = (Tc) XmlUtils.unwrap(cells.get(cellIndex));
            cell.getContent().clear();
            org.docx4j.wml.ObjectFactory factory = new org.docx4j.wml.ObjectFactory();
            P paragraph = factory.createP();
            R run = factory.createR();
            Text wText = factory.createText();
            wText.setValue(text != null ? text : "");
            run.getContent().add(wText);
            paragraph.getContent().add(run);
            cell.getContent().add(paragraph);
        }
    }
}
