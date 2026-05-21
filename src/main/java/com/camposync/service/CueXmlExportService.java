package com.camposync.service;

import com.camposync.entity.*;
import com.camposync.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CueXmlExportService {

    private final ExplotacionRepository explotacionRepository;
    private final ParcelaRepository parcelaRepository;
    private final RecintoRepository recintoRepository;
    private final TratamientoRepository tratamientoRepository;
    private final AplicadorRepository aplicadorRepository;
    private final EquipamientoRepository equipamientoRepository;
    private final AsesorRepository asesorRepository;

    @Transactional(readOnly = true)
    public byte[] generateCueXml(Long explotacionId) {
        Explotacion explotacion = explotacionRepository.findById(explotacionId)
                .orElseThrow(() -> new RuntimeException("Explotacion no encontrada"));

        Granjero granjero = explotacion.getGranjero();
        Asesoria asesoria = explotacion.getAsesoria();

        // 1. Recopilar todos los tratamientos de la explotación
        List<Parcela> parcelas = parcelaRepository.findByExplotacion_Id(explotacionId);
        List<Tratamiento> tratamientos = new ArrayList<>();

        if (parcelas != null) {
            for (Parcela p : parcelas) {
                List<Recinto> recintos = recintoRepository.findByParcela_Id(p.getId());
                if (recintos != null) {
                    for (Recinto r : recintos) {
                        List<Tratamiento> trList = tratamientoRepository.findByRecinto_Id(r.getId());
                        if (trList != null) {
                            tratamientos.addAll(trList);
                        }
                    }
                }
            }
        }

        // 2. Construir el documento XML con StringBuilder
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"utf-8\"?>\n");
        xml.append("<siex:CuadernoDigital xmlns:siex=\"http://www.fega.es/siex/cuaderno/v1\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">\n");

        // Cabecera
        xml.append("    <Cabecera>\n");
        xml.append("        <CodigoRea>").append(escapeXml(explotacion.getCodigoRea())).append("</CodigoRea>\n");
        xml.append("        <ProvinciaExplotacion>").append(escapeXml(explotacion.getProvinciaExplotacion())).append("</ProvinciaExplotacion>\n");
        xml.append("        <MunicipioExplotacion>").append(escapeXml(explotacion.getMunicipioExplotacion())).append("</MunicipioExplotacion>\n");
        xml.append("        <Campana>2025-2026</Campana>\n");
        xml.append("    </Cabecera>\n");

        // Titular (Granjero)
        xml.append("    <Titular>\n");
        if (granjero != null) {
            xml.append("        <NombreLegal>").append(escapeXml(granjero.getNombreLegal())).append("</NombreLegal>\n");
            xml.append("        <NIF>").append(escapeXml(granjero.getNif())).append("</NIF>\n");
            xml.append("        <Telefono>").append(escapeXml(granjero.getTelefono())).append("</Telefono>\n");
            xml.append("        <Email>").append(escapeXml(granjero.getUsername())).append("</Email>\n");
        } else {
            xml.append("        <NombreLegal></NombreLegal>\n");
            xml.append("        <NIF></NIF>\n");
            xml.append("        <Telefono></Telefono>\n");
            xml.append("        <Email></Email>\n");
        }
        xml.append("    </Titular>\n");

        // Asesor
        xml.append("    <Asesor>\n");
        String ropoAsesor = "";
        if (asesoria != null) {
            xml.append("        <NombreAsesoria>").append(escapeXml(asesoria.getNombre())).append("</NombreAsesoria>\n");
            List<Asesor> asesores = asesorRepository.findByAsesoria_Id(asesoria.getId());
            if (asesores != null && !asesores.isEmpty()) {
                Asesor selectedAsesor = asesores.stream()
                        .filter(Asesor::isEsJefe)
                        .findFirst()
                        .orElse(asesores.get(0));
                ropoAsesor = selectedAsesor.getNumColegiado();
                if (ropoAsesor == null) {
                    ropoAsesor = "";
                }
            }
        } else {
            xml.append("        <NombreAsesoria></NombreAsesoria>\n");
        }
        xml.append("        <ROPO>").append(escapeXml(ropoAsesor)).append("</ROPO>\n");
        xml.append("    </Asesor>\n");

        // Tratamientos
        xml.append("    <Tratamientos>\n");
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        for (Tratamiento t : tratamientos) {
            xml.append("        <Tratamiento>\n");
            xml.append("            <Fecha>").append(t.getFecha() != null ? t.getFecha().format(dtf) : "").append("</Fecha>\n");

            // Producto Fitosanitario
            xml.append("            <Producto>\n");
            if (t.getProductoFitosanitario() != null) {
                xml.append("                <NombreComercial>").append(escapeXml(t.getProductoFitosanitario().getNombre())).append("</NombreComercial>\n");
                xml.append("                <NumeroRegistro>").append(escapeXml(t.getProductoFitosanitario().getNumReg())).append("</NumeroRegistro>\n");
            } else {
                xml.append("                <NombreComercial></NombreComercial>\n");
                xml.append("                <NumeroRegistro></NumeroRegistro>\n");
            }
            xml.append("            </Producto>\n");

            // Recinto SIGPAC
            xml.append("            <Recinto>\n");
            Recinto r = t.getRecinto();
            if (r != null) {
                Parcela p = r.getParcela();
                if (p != null) {
                    xml.append("                <Provincia>").append(escapeXml(p.getProvincia())).append("</Provincia>\n");
                    xml.append("                <Municipio>").append(escapeXml(p.getMunicipio())).append("</Municipio>\n");
                    xml.append("                <Poligono>").append(p.getPoligono() != null ? p.getPoligono() : "").append("</Poligono>\n");
                    xml.append("                <Parcela>").append(p.getParcelaSigpac() != null ? p.getParcelaSigpac() : "").append("</Parcela>\n");
                } else {
                    xml.append("                <Provincia></Provincia>\n");
                    xml.append("                <Municipio></Municipio>\n");
                    xml.append("                <Poligono></Poligono>\n");
                    xml.append("                <Parcela></Parcela>\n");
                }
                xml.append("                <Cultivo>").append(escapeXml(r.getCultivo())).append("</Cultivo>\n");
            } else {
                xml.append("                <Provincia></Provincia>\n");
                xml.append("                <Municipio></Municipio>\n");
                xml.append("                <Poligono></Poligono>\n");
                xml.append("                <Parcela></Parcela>\n");
                xml.append("                <Cultivo></Cultivo>\n");
            }
            xml.append("                <SuperficieTratada>").append(t.getSuperficieTratada()).append("</SuperficieTratada>\n");
            xml.append("            </Recinto>\n");

            // Detalles del Tratamiento
            xml.append("            <PlagaObjetivo>").append(escapeXml(t.getPlagaObjetivo())).append("</PlagaObjetivo>\n");
            xml.append("            <MotivoTratamiento>").append(escapeXml(t.getMotivoTratamiento())).append("</MotivoTratamiento>\n");
            xml.append("            <CodigoPlaga>").append(escapeXml(t.getCodigoPlaga())).append("</CodigoPlaga>\n");
            xml.append("            <Dosis>").append(t.getDosis()).append("</Dosis>\n");
            xml.append("            <Unidades>").append(escapeXml(t.getUnidades())).append("</Unidades>\n");
            xml.append("            <VolumenCaldo>").append(t.getVolumenCaldo() != null ? t.getVolumenCaldo().toString() : "").append("</VolumenCaldo>\n");

            // Aplicador
            xml.append("            <Aplicador>\n");
            Aplicador ap = t.getAplicador();
            if (ap != null) {
                xml.append("                <Nombre>").append(escapeXml(ap.getNombre())).append("</Nombre>\n");
                xml.append("                <NIF>").append(escapeXml(ap.getNif())).append("</NIF>\n");
                xml.append("                <NumeroRopo>").append(escapeXml(ap.getNumeroRopo())).append("</NumeroRopo>\n");
            } else {
                xml.append("                <Nombre></Nombre>\n");
                xml.append("                <NIF></NIF>\n");
                xml.append("                <NumeroRopo></NumeroRopo>\n");
            }
            xml.append("            </Aplicador>\n");

            // Equipamiento
            xml.append("            <Equipamiento>\n");
            Equipamiento eq = t.getEquipamiento();
            if (eq != null) {
                xml.append("                <Tipo>").append(escapeXml(eq.getTipoMaquina())).append("</Tipo>\n");
                xml.append("                <MarcaModelo>").append(escapeXml(eq.getMarcaModelo())).append("</MarcaModelo>\n");
                xml.append("                <NumeroROMA>").append(escapeXml(eq.getAlias())).append("</NumeroROMA>\n");
                xml.append("                <ITEAF>").append(escapeXml(eq.getNumRegistroIteaf())).append("</ITEAF>\n");
            } else {
                xml.append("                <Tipo></Tipo>\n");
                xml.append("                <MarcaModelo></MarcaModelo>\n");
                xml.append("                <NumeroROMA></NumeroROMA>\n");
                xml.append("                <ITEAF></ITEAF>\n");
            }
            xml.append("            </Equipamiento>\n");

            xml.append("        </Tratamiento>\n");
        }

        xml.append("    </Tratamientos>\n");
        xml.append("</siex:CuadernoDigital>\n");

        return xml.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    private String escapeXml(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace("\"", "&quot;")
                    .replace("'", "&apos;");
    }
}
