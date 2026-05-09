package com.camposync.service;

import com.camposync.entity.Explotacion;
import com.camposync.entity.Granjero;
import com.camposync.entity.Tratamiento;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
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

    private static final Font TITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
    private static final Font HEADER_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
    private static final Font TEXT_FONT = FontFactory.getFont(FontFactory.HELVETICA, 10);
    private static final Font TABLE_HEADER_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
    private static final Font TABLE_TEXT_FONT = FontFactory.getFont(FontFactory.HELVETICA, 8);

    public byte[] generateCuePdf(Explotacion explotacion, List<Tratamiento> tratamientos) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, baos);

            document.open();

            // 1. Title
            Paragraph title = new Paragraph("CUADERNO DE EXPLOTACIÓN (CUE)", TITLE_FONT);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20f);
            document.add(title);

            // 2. Datos Generales
            document.add(new Paragraph("DATOS GENERALES DE LA EXPLOTACIÓN", HEADER_FONT));
            document.add(new Paragraph(" "));

            PdfPTable generalInfoTable = new PdfPTable(2);
            generalInfoTable.setWidthPercentage(100);
            generalInfoTable.setWidths(new float[]{1.5f, 2f});

            addGeneralInfoRow(generalInfoTable, "Nombre Explotación:", explotacion.getNombre());
            addGeneralInfoRow(generalInfoTable, "Código REA:", explotacion.getCodigoRea() != null ? explotacion.getCodigoRea() : "N/A");

            Granjero granjero = explotacion.getGranjero();
            if (granjero != null) {
                addGeneralInfoRow(generalInfoTable, "Titular:", granjero.getNombre());
                addGeneralInfoRow(generalInfoTable, "NIF Titular:", granjero.getNif());
            }

            document.add(generalInfoTable);
            document.add(new Paragraph(" "));

            // 3. Información de Tratamientos
            document.add(new Paragraph("INFORMACIÓN DE TRATAMIENTOS FITOSANITARIOS", HEADER_FONT));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(8);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1f, 1.5f, 1.5f, 1.5f, 1f, 1f, 1.5f, 1.5f});

            // Table Headers
            String[] headers = {"Fecha", "Parcela/Recinto", "Cultivo", "Producto", "Dosis", "Superficie (ha)", "Plaga", "Aplicador"};
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, TABLE_HEADER_FONT));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(cell);
            }

            // Table Data
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            for (Tratamiento t : tratamientos) {
                table.addCell(new Phrase(t.getFecha() != null ? t.getFecha().format(formatter) : "", TABLE_TEXT_FONT));

                String parcelaRecinto = "";
                String cultivo = "";
                if (t.getRecinto() != null) {
                    parcelaRecinto = "Parc: " + (t.getRecinto().getParcela() != null ? t.getRecinto().getParcela().getRefCatastral() : "") +
                            " Rec: " + t.getRecinto().getNumeroRecinto();
                    cultivo = t.getRecinto().getCultivo() != null ? t.getRecinto().getCultivo() : "";
                }
                table.addCell(new Phrase(parcelaRecinto, TABLE_TEXT_FONT));
                table.addCell(new Phrase(cultivo, TABLE_TEXT_FONT));

                String producto = t.getProductoFitosanitario() != null ? t.getProductoFitosanitario().getNombre() : "";
                table.addCell(new Phrase(producto, TABLE_TEXT_FONT));

                table.addCell(new Phrase(t.getDosis() + " " + (t.getUnidades() != null ? t.getUnidades() : ""), TABLE_TEXT_FONT));
                table.addCell(new Phrase(String.valueOf(t.getSuperficieTratada()), TABLE_TEXT_FONT));
                table.addCell(new Phrase(t.getPlagaObjetivo() != null ? t.getPlagaObjetivo() : "", TABLE_TEXT_FONT));

                String aplicador = t.getAplicador() != null ? t.getAplicador().getNombre() : "";
                table.addCell(new Phrase(aplicador, TABLE_TEXT_FONT));
            }

            document.add(table);
            document.add(new Paragraph(" "));
            document.add(new Paragraph(" "));

            // 4. Validación Final
            document.add(new Paragraph("VALIDACIÓN FINAL", HEADER_FONT));
            document.add(new Paragraph(" "));
            document.add(new Paragraph("El Asesor que suscribe valida el presente Cuaderno de Explotación, declarando que los datos contenidos en el mismo relativos a los tratamientos fitosanitarios son correctos y se ajustan a la normativa vigente.", TEXT_FONT));
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Firma del Asesor:", TEXT_FONT));
            document.add(new Paragraph(" "));
            document.add(new Paragraph(" "));
            document.add(new Paragraph("___________________________"));

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF", e);
        }
    }

    private void addGeneralInfoRow(PdfPTable table, String label, String value) {
        PdfPCell cell1 = new PdfPCell(new Phrase(label, TEXT_FONT));
        cell1.setBorder(PdfPCell.NO_BORDER);
        table.addCell(cell1);

        PdfPCell cell2 = new PdfPCell(new Phrase(value != null ? value : "", TEXT_FONT));
        cell2.setBorder(PdfPCell.NO_BORDER);
        table.addCell(cell2);
    }
}
