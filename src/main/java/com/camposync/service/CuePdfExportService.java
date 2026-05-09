package com.camposync.service;

import com.camposync.entity.Aplicador;
import com.camposync.entity.Asesor;
import com.camposync.entity.Equipamiento;
import com.camposync.entity.Explotacion;
import com.camposync.entity.Granjero;
import com.camposync.entity.Parcela;
import com.camposync.entity.Recinto;
import com.camposync.entity.Tratamiento;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class CuePdfExportService {

    private static final Font TITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
    private static final Font HEADER_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
    private static final Font SUBHEADER_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
    private static final Font TEXT_FONT = FontFactory.getFont(FontFactory.HELVETICA, 8);
    private static final Font TABLE_HEADER_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8);
    private static final Font TABLE_TEXT_FONT = FontFactory.getFont(FontFactory.HELVETICA, 7);

    public byte[] generateCuePdf(Explotacion explotacion, List<Tratamiento> tratamientos, List<Parcela> parcelas, List<Recinto> recintos, List<Aplicador> aplicadores, List<Equipamiento> equipos, Asesor asesor) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate());
            document.setMargins(30, 30, 30, 30);
            PdfWriter.getInstance(document, baos);

            document.open();

            // Título principal
            Paragraph title = new Paragraph("CUADERNO DE EXPLOTACIÓN (CUE)", TITLE_FONT);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(15f);
            document.add(title);

            // A. DATOS GENERALES
            document.add(createSectionTitle("A. DATOS GENERALES DE LA EXPLOTACIÓN Y DEL TITULAR"));
            PdfPTable generalInfoTable = new PdfPTable(4);
            generalInfoTable.setWidthPercentage(100);
            generalInfoTable.setSpacingAfter(10f);

            Granjero granjero = explotacion.getGranjero();
            String nombreTitular = granjero != null ? granjero.getNombre() : "";
            String nifTitular = granjero != null ? granjero.getNif() : "";
            String telefono = granjero != null && granjero.getTelefono() != null ? granjero.getTelefono() : "";
            String rea = explotacion.getCodigoRea() != null ? explotacion.getCodigoRea() : "";

            addGeneralInfoRow(generalInfoTable, "Titular de la Explotación:", nombreTitular, "NIF/CIF:", nifTitular);
            addGeneralInfoRow(generalInfoTable, "Teléfono:", telefono, "Número Registro (REA/REGEPA):", rea);
            addGeneralInfoRow(generalInfoTable, "Nombre de la Explotación:", explotacion.getNombre(), "Provincia/Municipio:", (explotacion.getProvinciaExplotacion() != null ? explotacion.getProvinciaExplotacion() : "") + " / " + (explotacion.getMunicipioExplotacion() != null ? explotacion.getMunicipioExplotacion() : ""));
            document.add(generalInfoTable);

            // B. PERSONAS Y EQUIPOS
            document.add(createSectionTitle("B. PERSONAS Y EQUIPOS DE APLICACIÓN DE PRODUCTOS FITOSANITARIOS"));

            document.add(new Paragraph("B.1. Personal Asesor", SUBHEADER_FONT));
            PdfPTable asesorTable = new PdfPTable(3);
            asesorTable.setWidthPercentage(100);
            asesorTable.setWidths(new float[]{1f, 1f, 1f});
            addTableHeaders(asesorTable, "Nombre y Apellidos / Razón Social", "NIF", "Nº Inscripción ROPO");
            asesorTable.addCell(createCell(asesor.getNombre(), TABLE_TEXT_FONT));
            asesorTable.addCell(createCell(asesor.getNif(), TABLE_TEXT_FONT));
            asesorTable.addCell(createCell(asesor.getNumColegiado(), TABLE_TEXT_FONT));
            asesorTable.setSpacingAfter(10f);
            document.add(asesorTable);

            document.add(new Paragraph("B.2. Personal Aplicador", SUBHEADER_FONT));
            PdfPTable aplicadorTable = new PdfPTable(4);
            aplicadorTable.setWidthPercentage(100);
            addTableHeaders(aplicadorTable, "Nombre y Apellidos / Razón Social", "NIF", "Nº Inscripción ROPO", "Nivel de Capacitación");
            if (aplicadores.isEmpty()) {
                addEmptyRows(aplicadorTable, 4, 1);
            } else {
                for (Aplicador a : aplicadores) {
                    aplicadorTable.addCell(createCell(a.getNombre(), TABLE_TEXT_FONT));
                    aplicadorTable.addCell(createCell(a.getNif(), TABLE_TEXT_FONT));
                    aplicadorTable.addCell(createCell(a.getNumeroRopo(), TABLE_TEXT_FONT));
                    aplicadorTable.addCell(createCell(a.getNivelCapacitacion(), TABLE_TEXT_FONT));
                }
            }
            aplicadorTable.setSpacingAfter(10f);
            document.add(aplicadorTable);

            document.add(new Paragraph("B.3. Equipos de Aplicación", SUBHEADER_FONT));
            PdfPTable equipoTable = new PdfPTable(4);
            equipoTable.setWidthPercentage(100);
            addTableHeaders(equipoTable, "Tipo de Máquina", "Marca y Modelo", "Nº Registro ROMA", "Fecha Inspección ITEAF");
            if (equipos.isEmpty()) {
                addEmptyRows(equipoTable, 4, 1);
            } else {
                for (Equipamiento eq : equipos) {
                    equipoTable.addCell(createCell(eq.getTipoMaquina(), TABLE_TEXT_FONT));
                    equipoTable.addCell(createCell(eq.getMarcaModelo(), TABLE_TEXT_FONT));
                    equipoTable.addCell(createCell(eq.getNumRegistroIteaf(), TABLE_TEXT_FONT));
                    equipoTable.addCell(createCell("", TABLE_TEXT_FONT)); // ITEAF date not in DB yet
                }
            }
            equipoTable.setSpacingAfter(15f);
            document.add(equipoTable);

            // C. IDENTIFICACIÓN DE LAS PARCELAS
            document.add(createSectionTitle("C. IDENTIFICACIÓN DE LAS PARCELAS AGRÍCOLAS / RECINTOS"));
            PdfPTable recintoTable = new PdfPTable(7);
            recintoTable.setWidthPercentage(100);
            recintoTable.setWidths(new float[]{1f, 1f, 1f, 1f, 1f, 1.5f, 1f});
            addTableHeaders(recintoTable, "Provincia", "Municipio", "Polígono", "Parcela", "Recinto", "Uso / Sistema Cultivo", "Superficie (ha)");
            if (recintos.isEmpty()) {
                addEmptyRows(recintoTable, 7, 2);
            } else {
                for (Recinto r : recintos) {
                    Parcela p = r.getParcela();
                    recintoTable.addCell(createCell(p != null ? p.getProvincia() : "", TABLE_TEXT_FONT));
                    recintoTable.addCell(createCell(p != null ? p.getMunicipio() : "", TABLE_TEXT_FONT));
                    recintoTable.addCell(createCell(p != null && p.getPoligono() != null ? String.valueOf(p.getPoligono()) : "", TABLE_TEXT_FONT));
                    recintoTable.addCell(createCell(p != null && p.getParcelaSigpac() != null ? String.valueOf(p.getParcelaSigpac()) : "", TABLE_TEXT_FONT));
                    recintoTable.addCell(createCell(r.getNumeroRecinto() != null ? String.valueOf(r.getNumeroRecinto()) : "", TABLE_TEXT_FONT));
                    recintoTable.addCell(createCell((r.getUsoSigpac() != null ? r.getUsoSigpac() : "") + " " + (r.getSistemaCultivo() != null ? r.getSistemaCultivo() : ""), TABLE_TEXT_FONT));
                    recintoTable.addCell(createCell(r.getSuperficie() != null ? r.getSuperficie().toString() : "", TABLE_TEXT_FONT));
                }
            }
            recintoTable.setSpacingAfter(15f);
            document.add(recintoTable);

            // D. TRATAMIENTOS FITOSANITARIOS
            document.add(createSectionTitle("D. INFORMACIÓN SOBRE TRATAMIENTOS FITOSANITARIOS"));
            PdfPTable tratTable = new PdfPTable(10);
            tratTable.setWidthPercentage(100);
            tratTable.setWidths(new float[]{1f, 1f, 1f, 2f, 1.5f, 1f, 1f, 1.5f, 1f, 1.5f});
            addTableHeaders(tratTable, "Fecha", "Pol/Parc/Rec", "Plaga/Enfermedad", "Producto", "Nº Registro", "Dosis", "Unidades", "Superficie Trat. (ha)", "Vol. Caldo", "Aplicador / Equipo");
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            if (tratamientos.isEmpty()) {
                addEmptyRows(tratTable, 10, 3);
            } else {
                for (Tratamiento t : tratamientos) {
                    tratTable.addCell(createCell(t.getFecha() != null ? t.getFecha().format(formatter) : "", TABLE_TEXT_FONT));

                    String ref = "";
                    if (t.getRecinto() != null && t.getRecinto().getParcela() != null) {
                        Parcela p = t.getRecinto().getParcela();
                        ref = (p.getPoligono() != null ? p.getPoligono() : "") + "/" +
                              (p.getParcelaSigpac() != null ? p.getParcelaSigpac() : "") + "/" +
                              (t.getRecinto().getNumeroRecinto() != null ? t.getRecinto().getNumeroRecinto() : "");
                    }
                    tratTable.addCell(createCell(ref, TABLE_TEXT_FONT));
                    tratTable.addCell(createCell(t.getPlagaObjetivo() != null ? t.getPlagaObjetivo() : t.getCodigoPlaga(), TABLE_TEXT_FONT));
                    tratTable.addCell(createCell(t.getProductoFitosanitario() != null ? t.getProductoFitosanitario().getNombre() : "", TABLE_TEXT_FONT));
                    tratTable.addCell(createCell(t.getProductoFitosanitario() != null ? t.getProductoFitosanitario().getNumReg() : "", TABLE_TEXT_FONT));
                    tratTable.addCell(createCell(String.valueOf(t.getDosis()), TABLE_TEXT_FONT));
                    tratTable.addCell(createCell(t.getUnidades() != null ? t.getUnidades() : "", TABLE_TEXT_FONT));
                    tratTable.addCell(createCell(String.valueOf(t.getSuperficieTratada()), TABLE_TEXT_FONT));
                    tratTable.addCell(createCell(t.getVolumenCaldo() != null ? t.getVolumenCaldo().toString() : "", TABLE_TEXT_FONT));

                    String appText = "";
                    if (t.getAplicador() != null) appText += t.getAplicador().getNombre() + "\n";
                    if (t.getEquipamiento() != null) appText += "Eq: " + t.getEquipamiento().getAlias();
                    tratTable.addCell(createCell(appText, TABLE_TEXT_FONT));
                }
            }
            tratTable.setSpacingAfter(15f);
            document.add(tratTable);

            // E. FERTILIZACIÓN
            document.add(createSectionTitle("E. INFORMACIÓN SOBRE FERTILIZACIÓN Y ENMIENDAS"));
            PdfPTable fertTable = new PdfPTable(8);
            fertTable.setWidthPercentage(100);
            addTableHeaders(fertTable, "Fecha", "Pol/Parc/Rec", "Superficie (ha)", "Tipo Fertilizante", "Riqueza (N-P-K)", "Dosis", "Origen / Marca", "Aplicador");
            addEmptyRows(fertTable, 8, 3);
            fertTable.setSpacingAfter(15f);
            document.add(fertTable);

            // F. RIEGO
            document.add(createSectionTitle("F. INFORMACIÓN SOBRE RIEGO"));
            PdfPTable riegoTable = new PdfPTable(5);
            riegoTable.setWidthPercentage(100);
            addTableHeaders(riegoTable, "Fecha o Periodo", "Pol/Parc/Rec", "Sistema de Riego", "Volumen (m3/ha)", "Observaciones");
            addEmptyRows(riegoTable, 5, 2);
            riegoTable.setSpacingAfter(15f);
            document.add(riegoTable);

            // G. COSECHA Y COMERCIALIZACIÓN
            document.add(createSectionTitle("G. COSECHA, COMERCIALIZACIÓN Y SALIDAS DE PRODUCTO"));
            PdfPTable cosechaTable = new PdfPTable(6);
            cosechaTable.setWidthPercentage(100);
            addTableHeaders(cosechaTable, "Fecha Cosecha", "Pol/Parc/Rec", "Producto", "Cantidad (kg/t)", "Destino / Cliente", "Nº Albarán / Lote");
            addEmptyRows(cosechaTable, 6, 2);
            cosechaTable.setSpacingAfter(15f);
            document.add(cosechaTable);

            // H. ANÁLISIS
            document.add(createSectionTitle("H. ANÁLISIS DE SUELO, FOLIARES Y AGUA"));
            PdfPTable analisisTable = new PdfPTable(5);
            analisisTable.setWidthPercentage(100);
            addTableHeaders(analisisTable, "Fecha", "Pol/Parc/Rec", "Tipo de Análisis", "Laboratorio", "Resultados Principales");
            addEmptyRows(analisisTable, 5, 2);
            analisisTable.setSpacingAfter(15f);
            document.add(analisisTable);

            // I. ECORREGÍMENES Y OTRAS PRÁCTICAS
            document.add(createSectionTitle("I. OTRAS PRÁCTICAS Y ECORREGÍMENES"));
            PdfPTable ecoTable = new PdfPTable(4);
            ecoTable.setWidthPercentage(100);
            addTableHeaders(ecoTable, "Pol/Parc/Rec", "Práctica Realizada", "Fecha Inicio", "Observaciones / Detalles");
            addEmptyRows(ecoTable, 4, 2);
            ecoTable.setSpacingAfter(15f);
            document.add(ecoTable);

            // J. POSTCOSECHA Y SEMILLAS
            document.add(createSectionTitle("J. TRATAMIENTOS POSTCOSECHA Y SEMILLAS TRATADAS"));
            PdfPTable postTable = new PdfPTable(6);
            postTable.setWidthPercentage(100);
            addTableHeaders(postTable, "Fecha", "Lote / Origen", "Producto Fitosanitario", "Dosis", "Cant. Tratada", "Observaciones");
            addEmptyRows(postTable, 6, 2);
            postTable.setSpacingAfter(20f);
            document.add(postTable);

            // VALIDACIÓN FINAL
            document.add(createSectionTitle("VALIDACIÓN FINAL Y REGISTRO"));
            document.add(new Paragraph("El titular / asesor que suscribe valida el presente Cuaderno de Explotación, declarando que los datos contenidos en el mismo son correctos, veraces y se ajustan a la normativa vigente, incluyendo las intervenciones fitosanitarias y fertilización aplicadas a la explotación.", TEXT_FONT));
            document.add(new Paragraph(" "));

            PdfPTable firmaTable = new PdfPTable(2);
            firmaTable.setWidthPercentage(100);
            PdfPCell c1 = new PdfPCell(new Phrase("Firma del Titular / Representante:", HEADER_FONT));
            c1.setBorder(PdfPCell.NO_BORDER);
            c1.setMinimumHeight(60f);
            PdfPCell c2 = new PdfPCell(new Phrase("Firma del Asesor (si procede):", HEADER_FONT));
            c2.setBorder(PdfPCell.NO_BORDER);
            firmaTable.addCell(c1);
            firmaTable.addCell(c2);

            document.add(firmaTable);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF", e);
        }
    }

    private Paragraph createSectionTitle(String title) {
        Paragraph p = new Paragraph(title, HEADER_FONT);
        p.setSpacingAfter(6f);
        return p;
    }

    private void addGeneralInfoRow(PdfPTable table, String l1, String v1, String l2, String v2) {
        table.addCell(createCell(l1, TABLE_HEADER_FONT));
        table.addCell(createCell(v1 != null ? v1 : "", TEXT_FONT));
        table.addCell(createCell(l2, TABLE_HEADER_FONT));
        table.addCell(createCell(v2 != null ? v2 : "", TEXT_FONT));
    }

    private void addTableHeaders(PdfPTable table, String... headers) {
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, TABLE_HEADER_FONT));
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            cell.setBackgroundColor(new java.awt.Color(240, 240, 240));
            cell.setPadding(4f);
            table.addCell(cell);
        }
    }

    private void addEmptyRows(PdfPTable table, int numCols, int numRows) {
        for (int i = 0; i < numRows * numCols; i++) {
            table.addCell(createCell(" ", TABLE_TEXT_FONT));
        }
    }

    private PdfPCell createCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "", font));
        cell.setPadding(3f);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return cell;
    }
}