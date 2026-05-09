package com.camposync.service;

import com.camposync.entity.*;
import com.camposync.repository.ExplotacionRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
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

    private static final Font FONT_TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
    private static final Font FONT_HEADER = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 6);
    private static final Font FONT_CELL = FontFactory.getFont(FontFactory.HELVETICA, 6);

    public byte[] generateCuePdf(Long explotacionId) {
        Explotacion explotacion = explotacionRepository.findById(explotacionId)
                .orElseThrow(() -> new RuntimeException("Explotacion no encontrada"));

        Document document = new Document(PageSize.A4.rotate(), 20, 20, 20, 20);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Titulo General
            Paragraph title = new Paragraph("ANEXO II: MODELO DE CUADERNO DE EXPLOTACIÓN", FONT_TITLE);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(10);
            document.add(title);

            // A. DATOS GENERALES DE LA EXPLOTACIÓN
            addSectionTitle(document, "A. DATOS GENERALES DE LA EXPLOTACIÓN (Cumplimentar una sola vez o actualizar si procede)");

            // Titular
            PdfPTable tableTitular = new PdfPTable(6);
            tableTitular.setWidthPercentage(100);
            tableTitular.setSpacingAfter(10);
            tableTitular.setWidths(new float[]{2f, 2f, 2f, 1f, 1f, 2f});

            Granjero granjero = explotacion.getGranjero();
            String nombreGranjero = granjero != null ? granjero.getNombreLegal() : "";
            String nifGranjero = granjero != null ? granjero.getNif() : "";
            String telefonoGranjero = granjero != null ? granjero.getTelefono() : "";

            addCellHeader(tableTitular, "Titular de la explotación (Apellidos y nombre o razón social):");
            addCellData(tableTitular, nombreGranjero);
            addCellHeader(tableTitular, "NIF:");
            addCellData(tableTitular, nifGranjero);
            addCellHeader(tableTitular, "Nº de inscripción en el REGEPA:");
            addCellData(tableTitular, explotacion.getCodigoRea() != null ? explotacion.getCodigoRea() : "");

            addCellHeader(tableTitular, "Domicilio:");
            addCellData(tableTitular, "");
            addCellHeader(tableTitular, "C.P.:");
            addCellData(tableTitular, "");
            addCellHeader(tableTitular, "Provincia:");
            addCellData(tableTitular, explotacion.getProvinciaExplotacion() != null ? explotacion.getProvinciaExplotacion() : "");

            addCellHeader(tableTitular, "Municipio:");
            addCellData(tableTitular, explotacion.getMunicipioExplotacion() != null ? explotacion.getMunicipioExplotacion() : "");
            addCellHeader(tableTitular, "Teléfono(s):");
            addCellData(tableTitular, telefonoGranjero);
            addCellHeader(tableTitular, "Correo electrónico:");
            addCellData(tableTitular, granjero != null ? granjero.getUsername() : "");

            addCellHeader(tableTitular, "Representante legal (si procede):");
            addCellData(tableTitular, "");
            addCellHeader(tableTitular, "NIF del Representante legal:");
            addCellData(tableTitular, "");
            addCellHeader(tableTitular, "Teléfono y Correo electrónico:");
            addCellData(tableTitular, "");

            document.add(tableTitular);

            // Asesoramiento
            PdfPTable tableAsesor = new PdfPTable(4);
            tableAsesor.setWidthPercentage(100);
            tableAsesor.setSpacingAfter(10);

            Asesoria asesoria = explotacion.getAsesoria();
            String nombreAsesor = asesoria != null ? asesoria.getNombre() : "";
            String nifAsesor = "";

            addCellHeader(tableAsesor, "IDENTIFICACIÓN DE LA AGRUPACIÓN O ENTIDAD DE ASESORAMIENTO (en caso de estar integrado en alguna)");
            addCellData(tableAsesor, "");
            addCellHeader(tableAsesor, "Nº de Registro:");
            addCellData(tableAsesor, "");

            addCellHeader(tableAsesor, "Persona que asesora a la explotación (Apellidos y nombre):");
            addCellData(tableAsesor, nombreAsesor);
            addCellHeader(tableAsesor, "NIF:");
            addCellData(tableAsesor, nifAsesor);

            document.add(tableAsesor);

            // Zonas Vulnerables
            document.add(new Paragraph("PARCELAS EN ZONAS VULNERABLES (ZZVV):", FONT_HEADER));
            PdfPTable tableZZVV = new PdfPTable(2);
            tableZZVV.setWidthPercentage(100);
            tableZZVV.setSpacingAfter(10);
            addCellHeader(tableZZVV, "¿La explotación cuenta con parcelas incluidas total o parcialmente en zonas declaradas como vulnerables a la contaminación por nitratos?");
            addCellData(tableZZVV, "SI [ ]   NO [ ]");
            addCellHeader(tableZZVV, "En caso afirmativo, indicar número de expediente asignado como explotación con parcelas en zona vulnerable:");
            addCellData(tableZZVV, "");
            document.add(tableZZVV);

            // Captacion de agua
            document.add(new Paragraph("Relación de parcelas en las que hay puntos de captación de agua para consumo humano:", FONT_HEADER));
            PdfPTable tableAgua = new PdfPTable(1);
            tableAgua.setWidthPercentage(100);
            tableAgua.setSpacingAfter(10);
            addCellData(tableAgua, "(Espacio vacío intencionalmente para rellenar a mano)");
            document.add(tableAgua);

            document.newPage();

            // B. PERSONAS QUE INTERVIENEN Y EQUIPOS DE APLICACIÓN
            addSectionTitle(document, "B. PERSONAS QUE INTERVIENEN Y EQUIPOS DE APLICACIÓN DE PRODUCTOS FITOSANITARIOS (Cumplimentar una sola vez o actualizar si procede)");

            document.add(new Paragraph("B.2. PERSONAL QUE INTERVIENE EN LA APLICACIÓN DE PRODUCTOS FITOSANITARIOS:", FONT_HEADER));
            PdfPTable tableAplicadores = new PdfPTable(7);
            tableAplicadores.setWidthPercentage(100);
            tableAplicadores.setSpacingAfter(10);
            tableAplicadores.setWidths(new float[]{3f, 2f, 2f, 1f, 1f, 1f, 1f});

            addCellHeader(tableAplicadores, "Apellidos y nombre");
            addCellHeader(tableAplicadores, "NIF");
            addCellHeader(tableAplicadores, "Nº Inscripción en ROPO");
            addCellHeader(tableAplicadores, "Carné Básico");
            addCellHeader(tableAplicadores, "Carné Cualif.");
            addCellHeader(tableAplicadores, "Carné Fumig.");
            addCellHeader(tableAplicadores, "Piloto aplicador");

            List<Aplicador> aplicadores = aplicadorRepository.findByGranjero_Id(granjero != null ? granjero.getId() : -1L);
            if (aplicadores != null && !aplicadores.isEmpty()) {
                for (Aplicador a : aplicadores) {
                    addCellData(tableAplicadores, a.getNombre());
                    addCellData(tableAplicadores, a.getNif());
                    addCellData(tableAplicadores, a.getNumeroRopo() != null ? a.getNumeroRopo() : "");
                    String nivel = a.getNivelCapacitacion() != null ? a.getNivelCapacitacion() : "";
                    addCellData(tableAplicadores, nivel.equalsIgnoreCase("BASICO") ? "X" : "");
                    addCellData(tableAplicadores, nivel.equalsIgnoreCase("CUALIFICADO") ? "X" : "");
                    addCellData(tableAplicadores, nivel.equalsIgnoreCase("FUMIGADOR") ? "X" : "");
                    addCellData(tableAplicadores, nivel.equalsIgnoreCase("PILOTO") ? "X" : "");
                }
            } else {
                for(int i=0; i<7; i++) addCellData(tableAplicadores, "");
            }
            document.add(tableAplicadores);

            document.add(new Paragraph("B.3. EQUIPOS DE APLICACIÓN DE PRODUCTOS FITOSANITARIOS PROPIOS:", FONT_HEADER));
            PdfPTable tableEquipos = new PdfPTable(5);
            tableEquipos.setWidthPercentage(100);
            tableEquipos.setSpacingAfter(10);

            addCellHeader(tableEquipos, "Tipo de equipo");
            addCellHeader(tableEquipos, "Marca y modelo");
            addCellHeader(tableEquipos, "Fecha adquisición");
            addCellHeader(tableEquipos, "Nº de inscripción en el ROMA");
            addCellHeader(tableEquipos, "Fecha de la última inspección (ITEAF)");

            List<Equipamiento> equipos = equipamientoRepository.findByGranjero_Id(granjero != null ? granjero.getId() : -1L);
            if (equipos != null && !equipos.isEmpty()) {
                for (Equipamiento e : equipos) {
                    addCellData(tableEquipos, e.getTipoMaquina());
                    addCellData(tableEquipos, e.getMarcaModelo());
                    addCellData(tableEquipos, "");
                    addCellData(tableEquipos, e.getAlias());
                    addCellData(tableEquipos, e.getNumRegistroIteaf());
                }
            } else {
                for(int i=0; i<5; i++) addCellData(tableEquipos, "");
            }
            document.add(tableEquipos);

            // Preguntas B.3.b
            PdfPTable tableControlB = new PdfPTable(2);
            tableControlB.setWidthPercentage(100);
            tableControlB.setSpacingAfter(10);
            addCellHeader(tableControlB, "¿En la explotación se realizan tratamientos postcosecha con productos fitosanitarios?");
            addCellData(tableControlB, "SI [ ]   NO [ ]");
            addCellHeader(tableControlB, "¿En la explotación se realizan tratamientos de los locales o almacenes de cosecha con productos fitosanitarios?");
            addCellData(tableControlB, "SI [ ]   NO [ ]");
            addCellHeader(tableControlB, "¿En la explotación se realizan tratamientos de los medios de transporte de las cosechas con productos fitosanitarios?");
            addCellData(tableControlB, "SI [ ]   NO [ ]");
            addCellHeader(tableControlB, "¿Existen los correspondientes boletines de análisis de residuos de productos fitosanitarios en las cosechas (solamente cuando se realicen a petición propia o lo exija una norma)?");
            addCellData(tableControlB, "SI [ ]   NO [ ]");
            document.add(tableControlB);

            document.newPage();

            // C. IDENTIFICACIÓN DE LAS PARCELAS
            addSectionTitle(document, "C. IDENTIFICACIÓN DE LAS PARCELAS DE LA EXPLOTACIÓN (Cumplimentar una sola vez o actualizar si procede)");
            PdfPTable tableParcelas = new PdfPTable(19);
            tableParcelas.setWidthPercentage(100);
            tableParcelas.setSpacingAfter(10);
            tableParcelas.setWidths(new float[]{1f,1f,1f,1f,1f,1f,1f,1f,1f,1f,1f,1f,1f,1f,1f,1f,1f,1f,1f});

            String[] cabecerasC = {
                "Nº Orden", "Provincia", "Municipio", "Agregado", "Zona", "Polígono", "Parcela", "Recinto",
                "Sup. SIGPAC (ha)", "Sup. cultivada (ha)", "Especie (Producto)", "Variedad", "Fecha inicio cultivo", "Fecha fin Cultivo",
                "Sistema de riego", "Sistema explot.", "Sistema de asesoramiento (GIP)", "Pendiente (%)", "ZV (S/N)"
            };
            for (String h : cabecerasC) addCellHeader(tableParcelas, h);

            int nOrden = 1;
            List<Parcela> parcelas = parcelaRepository.findByExplotacion_Id(explotacionId);
            if (parcelas != null) {
                for (Parcela p : parcelas) {
                    List<Recinto> recintos = recintoRepository.findByParcela_Id(p.getId());
                    if (recintos != null) {
                        for (Recinto r : recintos) {
                            addCellData(tableParcelas, String.valueOf(nOrden++));
                            addCellData(tableParcelas, p.getProvincia() != null ? p.getProvincia() : "");
                            addCellData(tableParcelas, p.getMunicipio() != null ? p.getMunicipio() : "");
                            addCellData(tableParcelas, p.getAgregado() != null ? String.valueOf(p.getAgregado()) : "");
                            addCellData(tableParcelas, p.getZona() != null ? String.valueOf(p.getZona()) : "");
                            addCellData(tableParcelas, p.getPoligono() != null ? String.valueOf(p.getPoligono()) : "");
                            addCellData(tableParcelas, p.getParcelaSigpac() != null ? String.valueOf(p.getParcelaSigpac()) : "");
                            addCellData(tableParcelas, String.valueOf(r.getNumeroRecinto()));
                            addCellData(tableParcelas, r.getSuperficie() != null ? r.getSuperficie().toString() : "");
                            addCellData(tableParcelas, r.getSuperficie() != null ? r.getSuperficie().toString() : ""); // Asumimos cultivada = sigpac
                            addCellData(tableParcelas, r.getCultivo() != null ? r.getCultivo() : "");
                            addCellData(tableParcelas, r.getSistemaCultivo() != null ? r.getSistemaCultivo() : "");
                            addCellData(tableParcelas, "");
                            addCellData(tableParcelas, "");
                            addCellData(tableParcelas, "");
                            addCellData(tableParcelas, r.getUsoSigpac() != null ? r.getUsoSigpac() : "");
                            addCellData(tableParcelas, "");
                            addCellData(tableParcelas, "");
                            addCellData(tableParcelas, "");
                        }
                    }
                }
            }
            if (nOrden == 1) {
                for(int i=0; i<19; i++) addCellData(tableParcelas, "");
            }
            document.add(tableParcelas);

            document.newPage();

            // D. REGISTRO DE TRATAMIENTOS FITOSANITARIOS
            addSectionTitle(document, "D. REGISTRO DE TRATAMIENTOS FITOSANITARIOS");

            document.add(new Paragraph("TRATAMIENTO DE SEMILLAS:", FONT_HEADER));
            PdfPTable tableSemillas = new PdfPTable(6);
            tableSemillas.setWidthPercentage(100);
            tableSemillas.setSpacingAfter(10);
            addCellHeader(tableSemillas, "Identificación parcela");
            addCellHeader(tableSemillas, "Producto");
            addCellHeader(tableSemillas, "Nombre Comercial");
            addCellHeader(tableSemillas, "Nº Registro");
            addCellHeader(tableSemillas, "Lote");
            addCellHeader(tableSemillas, "Cantidad");
            for(int i=0; i<6; i++) addCellData(tableSemillas, "");
            document.add(tableSemillas);

            document.add(new Paragraph("TRATAMIENTOS REALIZADOS:", FONT_HEADER));
            PdfPTable tableTratamientos = new PdfPTable(10);
            tableTratamientos.setWidthPercentage(100);
            tableTratamientos.setSpacingAfter(10);
            tableTratamientos.setWidths(new float[]{1.5f, 2f, 1f, 1.5f, 1.5f, 1.5f, 1.5f, 1.5f, 2.5f, 1f});

            String[] cabecerasD = {
                "Fecha", "Identificación parcela", "Superf. Tratada", "Plaga/Mala hierba", "Aplicador", "Equipo",
                "Justificación del tratamiento", "Alternativas no químicas", "Producto Fitosanitario (Nombre Comercial, Nº Registro, Dosis, Kg/Litros)", "Eficacia"
            };
            for (String h : cabecerasD) addCellHeader(tableTratamientos, h);

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            boolean tratEncontrado = false;

            if (parcelas != null) {
                for (Parcela p : parcelas) {
                    List<Recinto> recintos = recintoRepository.findByParcela_Id(p.getId());
                    if (recintos != null) {
                        for (Recinto r : recintos) {
                            List<Tratamiento> tratamientos = tratamientoRepository.findByRecinto_Id(r.getId());
                            if (tratamientos != null) {
                                for (Tratamiento t : tratamientos) {
                                    tratEncontrado = true;
                                    addCellData(tableTratamientos, t.getFecha() != null ? t.getFecha().format(dtf) : "");
                                    String idParcela = String.format("Pol %s Par %s Rec %d",
                                            p.getPoligono()!=null ? p.getPoligono() : "-",
                                            p.getParcelaSigpac()!=null ? p.getParcelaSigpac() : "-",
                                            r.getNumeroRecinto());
                                    addCellData(tableTratamientos, idParcela);
                                    addCellData(tableTratamientos, r.getSuperficie() != null ? r.getSuperficie().toString() : "");
                                    addCellData(tableTratamientos, t.getCodigoPlaga() != null ? t.getCodigoPlaga() : "");

                                    Aplicador app = t.getAplicador();
                                    addCellData(tableTratamientos, app != null ? app.getNombre() : "");
                                    addCellData(tableTratamientos, "");
                                    addCellData(tableTratamientos, t.getMotivoTratamiento() != null ? t.getMotivoTratamiento() : "");
                                    addCellData(tableTratamientos, "");

                                    ProductoFitosanitario prod = t.getProductoFitosanitario();
                                    String prodInfo = "";
                                    if (prod != null) {
                                        prodInfo = String.format("%s, %s, %s L/kg",
                                                prod.getNombre(),
                                                prod.getNumReg() != null ? prod.getNumReg() : "",
                                                t.getDosis() > 0 ? String.valueOf(t.getDosis()) : "");
                                    }
                                    addCellData(tableTratamientos, prodInfo);
                                    addCellData(tableTratamientos, "Buena");
                                }
                            }
                        }
                    }
                }
            }
            if (!tratEncontrado) {
                for(int i=0; i<10; i++) addCellData(tableTratamientos, "");
            }
            document.add(tableTratamientos);

            // Validación
            PdfPTable tableValidacion = new PdfPTable(2);
            tableValidacion.setWidthPercentage(100);
            tableValidacion.setSpacingAfter(10);
            addCellHeader(tableValidacion, "Validación intermedia (Opcional): Fecha, Firma");
            addCellData(tableValidacion, "");
            addCellHeader(tableValidacion, "Validación final (Anual): Fecha, Firma");
            addCellData(tableValidacion, "");
            document.add(tableValidacion);

            // E a J en blanco
            document.newPage();
            addEmptySection(document, "E. REGISTRO DE FERTILIZACIÓN", new String[]{"Fecha", "Identificación parcela", "Superf. Fertilizada", "Abono orgánico", "Abono inorgánico", "Dosis", "Técnica de aplicación"});
            addEmptySection(document, "F. REGISTRO DE RIEGO", new String[]{"Fecha", "Identificación parcela", "Superf. Regada", "Volumen (m3)", "Calidad agua", "Sistema de riego"});
            addEmptySection(document, "G. REGISTRO DE PRODUCCIÓN COSECHADA", new String[]{"Fecha", "Identificación parcela", "Superf. Recolectada", "Producto", "Cantidad (kg)", "Destino"});
            addEmptySection(document, "H. REGISTRO DE ANÁLISIS", new String[]{"Fecha", "Identificación parcela/lote", "Tipo de análisis", "Laboratorio", "Resultado"});
            addEmptySection(document, "I. REGISTRO DE FACTURAS", new String[]{"Fecha", "Nº Factura", "Proveedor", "Concepto", "Importe"});
            addEmptySection(document, "J. REGISTRO DE TRATAMIENTOS POSTCOSECHA", new String[]{"Fecha", "Producto Cosechado", "Lote", "Cantidad", "Producto Fitosanitario", "Dosis", "Eficacia"});

            document.close();
        } catch (DocumentException e) {
            throw new RuntimeException("Error generando PDF CUE", e);
        }

        return out.toByteArray();
    }

    private void addSectionTitle(Document document, String title) throws DocumentException {
        Paragraph p = new Paragraph(title, FONT_TITLE);
        p.setSpacingBefore(10);
        p.setSpacingAfter(10);
        document.add(p);
    }

    private void addEmptySection(Document document, String title, String[] headers) throws DocumentException {
        addSectionTitle(document, title);
        PdfPTable table = new PdfPTable(headers.length);
        table.setWidthPercentage(100);
        table.setSpacingAfter(20);
        for (String h : headers) {
            addCellHeader(table, h);
        }
        for (int i = 0; i < headers.length * 2; i++) {
            addCellData(table, "");
        }
        document.add(table);
    }

    private void addCellHeader(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FONT_HEADER));
        cell.setBackgroundColor(new java.awt.Color(230, 230, 230));
        cell.setPadding(4);
        table.addCell(cell);
    }

    private void addCellData(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FONT_CELL));
        cell.setPadding(4);
        table.addCell(cell);
    }
}
