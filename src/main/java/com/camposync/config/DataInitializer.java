package com.camposync.config;

import com.camposync.entity.*;
import com.camposync.repository.*;
import com.camposync.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final PlanRepository                  planRepository;
    private final AsesoriaRepository              asesoriaRepository;
    private final ProductoFitosanitarioRepository productoRepository;
    private final AuthService                     authService;
    private final GranjeroRepository              granjeroRepository;
    private final ExplotacionRepository           explotacionRepository;
    private final ParcelaRepository               parcelaRepository;
    private final RecintoRepository               recintoRepository;
    private final InventarioRepository            inventarioRepository;
    private final TratamientoRepository           tratamientoRepository;
    private final AsesorRepository                asesorRepository;
    private final AplicadorRepository             aplicadorRepository;
    private final EquipamientoRepository          equipamientoRepository;

    @Override
    @Transactional
    public void run(String... args) {
        seedUsuariosBase();
    }

    private void seedUsuariosBase() {
        if (planRepository.count() > 0) {
            log.info("Datos base ya inicializados, omitiendo seed de usuarios.");
            return;
        }

        // 1º — Plan y Asesoría
        Plan plan = planRepository.save(Plan.builder()
                .nombre("Plan Básico")
                .limiteExplotaciones(10)
                .precioMensual(29.99f)
                .isDefault(true)
                .build());

        Asesoria asesoria = asesoriaRepository.save(Asesoria.builder()
                .nombre("Calatrava Asesores")
                .email("demo@camposync.com")
                .provincia("Ciudad Real")
                .plan(plan)
                .activo(true)
                .build());

        // 2º — Usuarios
        // Asesor: "admin"
        authService.registerAsesor("admin", "admin123", "Jefe Admin", "12345678Z", "Jefe Admin", asesoria.getId(), true);
        Asesor adminAsesor = asesorRepository.findByUsername("admin")
                .orElseThrow(() -> new IllegalStateException("admin no encontrado tras el seed"));
        adminAsesor.setNumColegiado("13/99999/A");
        asesorRepository.save(adminAsesor);

        // Granjero: "contacto@fincalacalatrava.com"
        authService.registerGranjero("contacto@fincalacalatrava.com", "granjero123", "Finca La Calatrava S.L.", "B13123456", "Finca La Calatrava S.L.", "600000000", "0111", asesoria.getId());
        Granjero granjero = granjeroRepository.findByUsername("contacto@fincalacalatrava.com")
                .orElseThrow(() -> new IllegalStateException("contacto@fincalacalatrava.com no encontrado tras el seed"));

        // 3º — Explotación
        Explotacion explotacion = explotacionRepository.save(Explotacion.builder()
                .nombre("Finca La Calatrava")
                .refSig("SIG-13-023-0-001")
                .superficieTotal(new BigDecimal("25.5000"))
                .estado("ACTIVA")
                .codigoRea("ES130230001")
                .tipoExplotacion("PF")
                .orientacionProductiva("OL")
                .provinciaExplotacion("13")
                .municipioExplotacion("023")
                .anioDeclaracion(2024)
                .asesoria(asesoria)
                .granjero(granjero)
                .build());

        // 4º — Parcela
        Parcela parcelaNorte = parcelaRepository.save(Parcela.builder()
                .refCatastral("13023A0040001200000JK")
                .municipio("Daimiel")
                .provincia("Ciudad Real")
                .poligono(4)
                .parcelaSigpac(12)
                .explotacion(explotacion)
                .build());

        parcelaRepository.save(Parcela.builder()
                .refCatastral("13023A0040001300000MR")
                .municipio("Daimiel")
                .provincia("Ciudad Real")
                .poligono(4)
                .parcelaSigpac(13)
                .explotacion(explotacion)
                .build());

        // 5º — Productos fitosanitarios
        seedProductosFitosanitarios();

        ProductoFitosanitario cobre = productoRepository.findAll().stream()
                .filter(p -> p.getNombre().contains("Cupreox"))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Cupreox no encontrado"));

        // 6º — Recinto (unidad mínima SIGPAC para el tratamiento)
        Recinto recinto = recintoRepository.save(Recinto.builder()
                .numeroRecinto(1)
                .superficie(new BigDecimal("12.5000"))
                .usoSigpac("OV")
                .sistemaCultivo("SE")
                .cultivo("Olivar")
                .parcela(parcelaNorte)
                .build());

        // 7º — Inventario
        inventarioRepository.save(Inventario.builder()
                .aliasAgric("Cobre — stock principal")
                .stockAct(50.0f)
                .granjero(granjero)
                .productoFitosanitario(cobre)
                .build());

        // Aplicador base
        Aplicador aplicador = aplicadorRepository.save(Aplicador.builder()
                .nombre("Manuel García")
                .nif("12345678Z")
                .numeroRopo("13-98765-P")
                .nivelCapacitacion("CUALIFICADO")
                .granjero(granjero)
                .build());

        // Equipamiento base
        Equipamiento equipamiento = equipamientoRepository.save(Equipamiento.builder()
                .alias("13-0948") // ROMA
                .tipoMaquina("Atomizador remolcado")
                .marcaModelo("Hardi Mercury 2000")
                .numRegistroIteaf("ITEAF-13-876")
                .granjero(granjero)
                .build());

        // 8º — Tratamiento (FK → recinto)
        tratamientoRepository.save(Tratamiento.builder()
                .fecha(LocalDate.now())
                .dosis(2.5f)
                .unidades("kg/ha")
                .superficieTratada(12.5)
                .plagaObjetivo("Repilo del olivo")
                .motivoTratamiento("PR")
                .codigoPlaga("EPPO: REPI1")
                .volumenCaldo(new java.math.BigDecimal("800.00"))
                .estado("PENDIENTE")
                .validado(false)
                .aiConfidence(0f)
                .recinto(recinto)
                .granjero(granjero)
                .productoFitosanitario(cobre)
                .aplicador(aplicador)
                .equipamiento(equipamiento)
                .build());

        log.info("Usuarios de prueba creados:");
        log.info("  Asesor   → admin / admin123");
        log.info("  Granjero → contacto@fincalacalatrava.com / granjero123");
        log.info("  Tablas pobladas: explotacion, parcela (x2), recinto (x1), inventario, tratamiento");
    }

    private void seedProductosFitosanitarios() {
        if (productoRepository.count() > 0) {
            log.info("Productos fitosanitarios ya inicializados, omitiendo seed.");
            return;
        }

        productoRepository.save(ProductoFitosanitario.builder()
                .nombre("Cupreox 50 WP")
                .principioAct("Oxicloruro de cobre 50%")
                .numReg("12345")
                .cultivosAutori("Olivar,Viñedo,Manzano,Cítricos")
                .fechaCadu(LocalDate.of(2027, 12, 31))
                .dosisMin(new java.math.BigDecimal("1.5"))
                .dosisMax(new java.math.BigDecimal("3.0"))
                .unidadDosisOficial("kg/ha")
                .activo(true)
                .build());

        productoRepository.save(ProductoFitosanitario.builder()
                .nombre("Azufre Dorado")
                .principioAct("Azufre 80%")
                .numReg("54321")
                .cultivosAutori("Viñedo,Olivo,Tomate,Cereal")
                .fechaCadu(LocalDate.of(2026, 6, 30))
                .dosisMin(new java.math.BigDecimal("1.0"))
                .dosisMax(new java.math.BigDecimal("2.0"))
                .unidadDosisOficial("kg/ha")
                .activo(true)
                .build());

        productoRepository.save(ProductoFitosanitario.builder()
                .nombre("Glifosato 36 SL")
                .principioAct("Glifosato")
                .numReg("ES-00789")
                .cultivosAutori("Uso general herbicida")
                .fechaCadu(LocalDate.of(2028, 3, 31))
                .dosisMin(new java.math.BigDecimal("2.0"))
                .dosisMax(new java.math.BigDecimal("4.0"))
                .unidadDosisOficial("L/ha")
                .activo(true)
                .build());

        log.info("Productos fitosanitarios de prueba creados (Cupreox 50 WP, Azufre Dorado, Glifosato).");
    }
}
