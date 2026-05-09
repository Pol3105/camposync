package com.camposync.service;

import com.camposync.entity.*;
import com.camposync.repository.ExplotacionRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
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

    private static final Font FONT_TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
    private static final Font FONT_SECTION = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
    private static final Font FONT_HEADER = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 6);
    private static final Font FONT_CELL = FontFactory.getFont(FontFactory.HELVETICA, 6);
    private static final Font FONT_NOTE = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 5);

    public byte[] generateCuePdf(Long explotacionId) {
        Explotacion explotacion = explotacionRepository.findById(explotacionId)
                .orElseThrow(() -> new RuntimeException("Explotacion no encontrada"));

        Document document = new Document(PageSize.A4.rotate(), 20, 20, 20, 20);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Titulo General
            Paragraph title = new Paragraph("MODELO DEL CUADERNO DE EXPLOTACIÓN", FONT_TITLE);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(15);
            document.add(title);

            // A. DATOS GENERALES DE LA EXPLOTACIÓN
            addSectionTitle(document, "A. DATOS GENERALES DE LA EXPLOTACIÓN (Cumplimentar una sola vez o actualizar si procede)");

            // Titular
            PdfPTable tableTitular = new PdfPTable(6);
            tableTitular.setWidthPercentage(100);
            tableTitular.setSpacingAfter(10);
            tableTitular.setWidths(new float[]{2f, 2f, 1.5f, 1.5f, 1f, 2f});

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
            PdfPTable tableAsesor = new PdfPTable(6);
            tableAsesor.setWidthPercentage(100);
            tableAsesor.setSpacingAfter(10);
            tableAsesor.setWidths(new float[]{2f, 2f, 1f, 1f, 1f, 1.5f});

            Asesoria asesoria = explotacion.getAsesoria();
            String nombreAsesor = asesoria != null ? asesoria.getNombre() : "";
            String nifAsesor = ""; // Podriamos poner el CIF de la asesoria si lo tuvieramos

            addCellHeader(tableAsesor, "IDENTIFICACIÓN DE LA AGRUPACIÓN O ENTIDAD DE ASESORAMIENTO (en caso de estar integrado en alguna)");
            addCellData(tableAsesor, "");
            addCellHeader(tableAsesor, "Nº de Registro:");
            addCellData(tableAsesor, "");
            addCellHeader(tableAsesor, "Nº Inscripción en ROPO:");
            addCellData(tableAsesor, "");

            addCellHeader(tableAsesor, "Persona que asesora a la explotación (Apellidos y nombre):");
            addCellData(tableAsesor, nombreAsesor);
            addCellHeader(tableAsesor, "NIF:");
            addCellData(tableAsesor, nifAsesor);
            addCellHeader(tableAsesor, "Nº Inscripción en ROPO:");
            addCellData(tableAsesor, "");

            document.add(tableAsesor);

            // Zonas Vulnerables
            document.add(new Paragraph("PARCELAS EN ZONAS VULNERABLES (ZZVV):", FONT_SECTION));
            PdfPTable tableZZVV = new PdfPTable(2);
            tableZZVV.setWidthPercentage(100);
            tableZZVV.setSpacingAfter(10);
            addCellHeader(tableZZVV, "¿La explotación cuenta con parcelas incluidas total o parcialmente en zonas declaradas como vulnerables a la contaminación por nitratos?");
            addCellData(tableZZVV, "SI [ ]   NO [ ]");
            addCellHeader(tableZZVV, "En caso afirmativo, indicar número de expediente asignado como explotación con parcelas en zona vulnerable:");
            addCellData(tableZZVV, "");
            document.add(tableZZVV);

            // Captacion de agua
            document.add(new Paragraph("Relación de parcelas en las que hay puntos de captación de agua para consumo humano:", FONT_SECTION));
            PdfPTable tableAgua = new PdfPTable(1);
            tableAgua.setWidthPercentage(100);
            tableAgua.setSpacingAfter(10);
            addCellData(tableAgua, "(Espacio vacío intencionalmente para rellenar a mano)");
            document.add(tableAgua);

            document.newPage();

            // B. PERSONAS QUE INTERVIENEN Y EQUIPOS DE APLICACIÓN
            addSectionTitle(document, "B. PERSONAS QUE INTERVIENEN Y EQUIPOS DE APLICACIÓN DE PRODUCTOS FITOSANITARIOS (Cumplimentar una sola vez o actualizar si procede)");

            document.add(new Paragraph("B.2. PERSONAL QUE INTERVIENE EN LA APLICACIÓN DE PRODUCTOS FITOSANITARIOS:", FONT_SECTION));
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

            document.add(new Paragraph("B.3. EQUIPOS DE APLICACIÓN DE PRODUCTOS FITOSANITARIOS PROPIOS:", FONT_SECTION));
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
                    addCellData(tableEquipos, ""); // No tenemos fecha adquisición
                    addCellData(tableEquipos, e.getAlias()); // Alias -> ROMA provisionalmente
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
            tableParcelas.setSpacingAfter(5);
            tableParcelas.setWidths(new float[]{1f,1f,1.5f,1f,1f,1.2f,1.2f,1.2f,1.2f,1.2f,1.5f,1.5f,1.5f,1.5f,1f,1f,1f,1f,1f});

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
                            addCellData(tableParcelas, ""); // Variedad
                            addCellData(tableParcelas, ""); // Inicio Cultivo
                            addCellData(tableParcelas, ""); // Fin Cultivo
                            addCellData(tableParcelas, ""); // Sistema riego
                            addCellData(tableParcelas, r.getSistemaCultivo() != null ? r.getSistemaCultivo() : ""); // Sistema explotacion
                            addCellData(tableParcelas, ""); // Asesoramiento GIP
                            addCellData(tableParcelas, ""); // Pendiente
                            addCellData(tableParcelas, ""); // ZV S/N
                        }
                    }
                }
            }
            if (nOrden == 1) {
                for(int i=0; i<19; i++) addCellData(tableParcelas, "");
            }
            document.add(tableParcelas);
            Paragraph notaC = new Paragraph("(1) Sistema de riego: Aspersión (AS), Goteo (GO), Gravedad (GR), Manta (MA), Pivot (PI), Secano (SE). (2) Sistema de explotación: Regadío (RE), Secano (SE). (3) Sistema de asesoramiento (GIP): Producción Integrada (PI), Agricultura Ecológica (AE), Certificación GlobalGAP (GG)...", FONT_NOTE);
            document.add(notaC);

            document.newPage();

            // D. REGISTRO DE TRATAMIENTOS FITOSANITARIOS
            addSectionTitle(document, "D. REGISTRO DE TRATAMIENTOS FITOSANITARIOS");

            document.add(new Paragraph("TRATAMIENTO DE SEMILLAS:", FONT_SECTION));
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

            document.add(new Paragraph("INTERVENCIONES FITOSANITARIAS REALIZADAS:", FONT_SECTION));
            PdfPTable tableTratamientos = new PdfPTable(10);
            tableTratamientos.setWidthPercentage(100);
            tableTratamientos.setSpacingAfter(5);
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
                                    addCellData(tableTratamientos, "" != null ? "" : "");
                                    addCellData(tableTratamientos, t.getMotivoTratamiento() != null ? t.getMotivoTratamiento() : "");
                                    addCellData(tableTratamientos, ""); // Alternativas no químicas

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

            document.newPage();

            // E. FERTILIZACIÓN
            addSectionTitle(document, "E. REGISTRO DE FERTILIZACIÓN");
            document.add(new Paragraph("E.1 PLAN DE ABONADO:", FONT_SECTION));

            PdfPTable tablePlanAbonado = new PdfPTable(8);
            tablePlanAbonado.setWidthPercentage(100);
            tablePlanAbonado.setSpacingAfter(10);
            tablePlanAbonado.setWidths(new float[]{2f, 2f, 1f, 1f, 1f, 1f, 1f, 1f});
            String[] cabecerasPlanAbonado = {
                "Identificación parcela", "Fecha prevista", "Necesidad N", "Necesidad P2O5", "Necesidad K2O", "Aporte N", "Aporte P2O5", "Aporte K2O"
            };
            for (String h : cabecerasPlanAbonado) addCellHeader(tablePlanAbonado, h);
            for(int i=0; i<16; i++) addCellData(tablePlanAbonado, "");
            document.add(tablePlanAbonado);

            document.add(new Paragraph("E.2 APLICACIÓN REAL:", FONT_SECTION));
            PdfPTable tableFertilizacionReal = new PdfPTable(10);
            tableFertilizacionReal.setWidthPercentage(100);
            tableFertilizacionReal.setSpacingAfter(10);
            tableFertilizacionReal.setWidths(new float[]{1.5f, 2f, 1.5f, 2f, 1f, 1f, 1f, 1f, 1f, 1.5f});
            String[] cabecerasFertilizacionReal = {
                "Fecha", "Identificación parcela", "Superf. Fertilizada", "Abono (Tipo/Riqueza)", "Dosis", "N (kg/ha)", "P2O5 (kg/ha)", "K2O (kg/ha)", "Volumen (m3)", "Técnica aplicación"
            };
            for (String h : cabecerasFertilizacionReal) addCellHeader(tableFertilizacionReal, h);
            for(int i=0; i<20; i++) addCellData(tableFertilizacionReal, "");
            document.add(tableFertilizacionReal);

            document.newPage();

            // F. RIEGO
            addSectionTitle(document, "F. INFORMACIÓN DE RIEGO");
            document.add(new Paragraph("F.1 RIEGO GENERAL Y BUENAS PRÁCTICAS:", FONT_SECTION));
            PdfPTable tableRiego = new PdfPTable(6);
            tableRiego.setWidthPercentage(100);
            tableRiego.setSpacingAfter(10);
            String[] cabecerasRiego = {
                "Fecha", "Identificación parcela", "Superf. Regada", "Volumen (m3)", "Calidad agua", "Sistema de riego (y buenas prácticas)"
            };
            for (String h : cabecerasRiego) addCellHeader(tableRiego, h);
            for(int i=0; i<12; i++) addCellData(tableRiego, "");
            document.add(tableRiego);

            document.add(new Paragraph("F.2 FERTIRRIGACIÓN:", FONT_SECTION));
            PdfPTable tableFertirrigacion = new PdfPTable(5);
            tableFertirrigacion.setWidthPercentage(100);
            tableFertirrigacion.setSpacingAfter(10);
            String[] cabecerasFertirrigacion = {
                "Fecha", "Identificación parcela", "Producto aportado", "Dosis (kg/m3)", "Total Volumen (m3)"
            };
            for (String h : cabecerasFertirrigacion) addCellHeader(tableFertirrigacion, h);
            for(int i=0; i<10; i++) addCellData(tableFertirrigacion, "");
            document.add(tableFertirrigacion);

            document.newPage();

            // G-J ECORREGÍMENES (Nuevas Secciones)
            addSectionTitle(document, "G. ECORREGÍMENES: CUBIERTAS VEGETALES E INERTES EN CULTIVOS LEÑOSOS");
            PdfPTable tableCubiertas = new PdfPTable(6);
            tableCubiertas.setWidthPercentage(100);
            tableCubiertas.setSpacingAfter(20);
            String[] cabecerasCubiertas = {
                "Identificación parcela", "Tipo de Cubierta", "Fecha implantación", "Manejo (Segado/Picado)", "Uso fitosanitarios", "Observaciones"
            };
            for (String h : cabecerasCubiertas) addCellHeader(tableCubiertas, h);
            for(int i=0; i<12; i++) addCellData(tableCubiertas, "");
            document.add(tableCubiertas);

            addSectionTitle(document, "H. ECORREGÍMENES: CULTIVOS BAJO AGUA (ARROZ)");
            PdfPTable tableArroz = new PdfPTable(4);
            tableArroz.setWidthPercentage(100);
            tableArroz.setSpacingAfter(20);
            String[] cabecerasArroz = {
                "Identificación parcela", "Fecha siembra", "Fecha inundación", "Labores mecánicas"
            };
            for (String h : cabecerasArroz) addCellHeader(tableArroz, h);
            for(int i=0; i<8; i++) addCellData(tableArroz, "");
            document.add(tableArroz);

            document.newPage();

            addSectionTitle(document, "I. ECORREGÍMENES: SIEGA SOSTENIBLE Y FAUNA ESTEPARIA");
            PdfPTable tableSiega = new PdfPTable(4);
            tableSiega.setWidthPercentage(100);
            tableSiega.setSpacingAfter(20);
            String[] cabecerasSiega = {
                "Identificación parcela", "Tipo de cultivo", "Fecha de siega", "Técnica de siega"
            };
            for (String h : cabecerasSiega) addCellHeader(tableSiega, h);
            for(int i=0; i<8; i++) addCellData(tableSiega, "");
            document.add(tableSiega);

            addSectionTitle(document, "J. ECORREGÍMENES: PASTOREO EXTENSIVO E ISLAS DE BIODIVERSIDAD");
            PdfPTable tablePastoreo = new PdfPTable(5);
            tablePastoreo.setWidthPercentage(100);
            tablePastoreo.setSpacingAfter(20);
            String[] cabecerasPastoreo = {
                "Identificación parcela", "Carga ganadera (UGM/ha)", "Días de pastoreo", "Islas Biodiversidad (Superficie)", "Observaciones"
            };
            for (String h : cabecerasPastoreo) addCellHeader(tablePastoreo, h);
            for(int i=0; i<10; i++) addCellData(tablePastoreo, "");
            document.add(tablePastoreo);

            document.close();
        } catch (DocumentException e) {
            throw new RuntimeException("Error generando PDF CUE", e);
        }

        return out.toByteArray();
    }

    private void addSectionTitle(Document document, String title) throws DocumentException {
        Paragraph p = new Paragraph(title, FONT_SECTION);
        p.setSpacingBefore(10);
        p.setSpacingAfter(10);
        document.add(p);
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
