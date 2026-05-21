package com.camposync;

import com.camposync.entity.Explotacion;
import com.camposync.repository.ExplotacionRepository;
import com.camposync.service.CueXmlExportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class CamposyncApplicationTests {

	@Autowired
	private CueXmlExportService cueXmlExportService;

	@Autowired
	private ExplotacionRepository explotacionRepository;

	@Test
	void contextLoads() {
		assertNotNull(cueXmlExportService);
		assertNotNull(explotacionRepository);
	}

	@Test
	void testGenerateCueXmlWithRealData() {
		List<Explotacion> explotaciones = explotacionRepository.findAll();
		assertFalse(explotaciones.isEmpty(), "Debería haber explotaciones en la base de datos");

		// Obtener la primera explotación
		Explotacion explotacion = explotaciones.stream()
				.filter(e -> "Finca La Calatrava".equals(e.getNombre()))
				.findFirst()
				.orElse(explotaciones.get(0));

		byte[] xmlBytes = cueXmlExportService.generateCueXml(explotacion.getId());
		assertNotNull(xmlBytes);

		String xml = new String(xmlBytes, StandardCharsets.UTF_8);

		System.out.println("=== XML EXPORTADO EN TEST ===");
		System.out.println(xml);
		System.out.println("=============================");

		// Validar estructura básica
		assertTrue(xml.contains("<?xml version=\"1.0\" encoding=\"utf-8\"?>"));
		assertTrue(xml.contains("<siex:CuadernoDigital"));

		// Validar que el ROPO del asesor esté cargado y no vacío
		assertTrue(xml.contains("<ROPO>13/99999/A</ROPO>"), "El ROPO del asesor debería ser '13/99999/A'");

		// Validar provincia de Ciudad Real
		assertTrue(xml.contains("<ProvinciaExplotacion>13</ProvinciaExplotacion>"), "La provincia debe ser 13 (Ciudad Real)");

		// Validar que el titular tenga datos reales y NIF
		assertTrue(xml.contains("<NombreLegal>"), "Debe tener NombreLegal");
		assertTrue(xml.contains("<NIF>"), "Debe tener NIF");

		// Validar aplicadores e itinerario técnico
		assertTrue(xml.contains("<NumeroRopo>13-"), "Los aplicadores deben tener ROPO de Ciudad Real");
		assertTrue(xml.contains("<NumeroROMA>13-"), "El equipamiento debe tener ROMA con prefijo 13");
		assertTrue(xml.contains("<ITEAF>ITEAF-13-"), "El equipamiento debe tener registro ITEAF válido");
	}
}
