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

    @Override
    @Transactional
    public void run(String... args) {
        seedUsuariosBase();
        seedProductosFitosanitarios();
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
                .nombre("Asesoría Demo")
                .email("demo@camposync.com")
                .provincia("Madrid")
                .plan(plan)
                .activo(true)
                .build());

        // 2º — Usuarios
        authService.registerAsesor("admin", "admin123", "Jefe Admin", asesoria.getId(), true);
        authService.registerGranjero("granjero1", "granjero123", "Juan el Granjero", null, asesoria.getId());

        Granjero granjero = granjeroRepository.findByUsername("granjero1")
                .orElseThrow(() -> new IllegalStateException("granjero1 no encontrado tras el seed"));

        // 3º — Explotación
        Explotacion explotacion = explotacionRepository.save(Explotacion.builder()
                .nombre("Finca La Demo")
                .refSig("SIG-28-013-0-001")
                .superficieTotal(new BigDecimal("25.5000"))
                .estado("ACTIVA")
                .codigoRea("ES280130001")
                .tipoExplotacion("PF")
                .orientacionProductiva("CE")
                .provinciaExplotacion("28")
                .municipioExplotacion("013")
                .anioDeclaracion(2024)
                .asesoria(asesoria)
                .granjero(granjero)
                .build());

        // 4º — Parcela (sin cultivo/superficie: migrados al Recinto)
        Parcela parcelaNorte = parcelaRepository.save(Parcela.builder()
                .refCatastral("Parcela Norte")
                .municipio("Aranjuez")
                .provincia("Madrid")
                .poligono(12)
                .parcelaSigpac(34)
                .explotacion(explotacion)
                .build());

        parcelaRepository.save(Parcela.builder()
                .refCatastral("Parcela Sur")
                .municipio("Aranjuez")
                .provincia("Madrid")
                .poligono(12)
                .parcelaSigpac(35)
                .explotacion(explotacion)
                .build());

        // 5º — Productos fitosanitarios
        seedProductosFitosanitarios();

        ProductoFitosanitario producto = productoRepository.findAll().get(0);

        // 6º — Recinto (unidad mínima SIGPAC para el tratamiento)
        Recinto recinto = recintoRepository.save(Recinto.builder()
                .numeroRecinto(1)
                .superficie(new BigDecimal("12.5000"))
                .usoSigpac("TA")
                .sistemaCultivo("SE")
                .cultivo("TBL")
                .parcela(parcelaNorte)
                .build());

        // 7º — Inventario
        inventarioRepository.save(Inventario.builder()
                .aliasAgric("Captan — stock principal")
                .stockAct(50.0f)
                .granjero(granjero)
                .productoFitosanitario(producto)
                .build());

        // 8º — Tratamiento (FK → recinto)
        tratamientoRepository.save(Tratamiento.builder()
                .fecha(LocalDate.now())
                .dosis(2.5f)
                .unidades("L/ha")
                .superficieTratada(12.5)
                .plagaObjetivo("Mildiu de la vid")
                .motivoTratamiento("CU")
                .codigoPlaga("PLASVI")
                .tipoEquipo("PULV_TRAC")
                .numRegistroIteaf("ITEAF-28-001234")
                .fechaIteaf(LocalDate.of(2024, 3, 15))
                .volumenCaldo(new java.math.BigDecimal("200.00"))
                .nifAplicador("12345678Z")
                .numeroRopo("ROPO-28-0001")
                .nivelCapacitacionRopo("02")
                .estado("PENDIENTE")
                .validado(false)
                .aiConfidence(0f)
                .recinto(recinto)
                .granjero(granjero)
                .productoFitosanitario(producto)
                .build());

        log.info("Usuarios de prueba creados:");
        log.info("  Asesor   → admin / admin123");
        log.info("  Granjero → granjero1 / granjero123");
        log.info("  Tablas pobladas: explotacion, parcela (x2), recinto (x1), inventario, tratamiento");
    }

    private void seedProductosFitosanitarios() {
        if (productoRepository.count() > 0) {
            log.info("Productos fitosanitarios ya inicializados, omitiendo seed.");
            return;
        }

        productoRepository.save(ProductoFitosanitario.builder()
                .nombre("Captan 50 WP")
                .principioAct("Captan")
                .numReg("ES-00123")
                .cultivosAutori("Manzano,Peral,Vid,Fresa")
                .fechaCadu(LocalDate.of(2027, 12, 31))
                .dosisMin(new java.math.BigDecimal("1.5"))
                .dosisMax(new java.math.BigDecimal("3.0"))
                .unidadDosisOficial("kg/ha")
                .activo(true)
                .build());

        productoRepository.save(ProductoFitosanitario.builder()
                .nombre("Clorpirifos 48 EC")
                .principioAct("Clorpirifos")
                .numReg("ES-00456")
                .cultivosAutori("Cereal,Olivo,Citricos")
                .fechaCadu(LocalDate.of(2026, 6, 30))
                .dosisMin(new java.math.BigDecimal("1.0"))
                .dosisMax(new java.math.BigDecimal("2.0"))
                .unidadDosisOficial("L/ha")
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

        log.info("Productos fitosanitarios de prueba creados (Captan, Clorpirifos, Glifosato).");
    }
}
