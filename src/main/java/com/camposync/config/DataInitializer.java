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

       // 3º — Explotación (Actualizada con campos SIEX)
        Explotacion explotacion = explotacionRepository.save(Explotacion.builder()
                .nombre("Finca La Demo")
                .refSig("SIG-2024-001")
                .superficieTotal(new BigDecimal("25.5000"))
                .codigoRea("ES0100000001") // Código REA obligatorio
                .tipoExplotacion("01")      // 01 = Agrícola
                .orientacionProductiva("0111") // 0111 = Cereales
                .provinciaExplotacion("28") // 28 = Madrid
                .municipioExplotacion("013") // 013 = Aranjuez
                .anioDeclaracion(2026)
                .estado("ACTIVA")
                .asesoria(asesoria)
                .granjero(granjero)
                .build());

        // 4º — Parcela (Actualizada con campos SIGPAC)
        Parcela parcelaNorte = parcelaRepository.save(Parcela.builder()
                .refCatastral("Parcela Norte")
                .municipio("Aranjuez")
                .provincia("Madrid")
                .poligono(12)
                .parcelaSigpac(34)
                .agregado(0)
                .zona(0)
                .explotacion(explotacion)
                .build());

        // 5º — Productos fitosanitarios
        seedProductosFitosanitarios();
        ProductoFitosanitario producto = productoRepository.findAll().get(0);

        // 6º — Recinto
        Recinto recinto = recintoRepository.save(Recinto.builder()
                .numeroRecinto(1)
                .superficie(new BigDecimal("12.5000"))
                .usoSigpac("TA")   // Tierras Arables
                .sistemaCultivo("SE") // Secano
                .cultivo("TBL")    // Trigo Blando
                .parcela(parcelaNorte)
                .build());

        // 7º — Inventario
        inventarioRepository.save(Inventario.builder()
                .aliasAgric("Captan — stock principal")
                .stockAct(50.0f)
                .granjero(granjero)
                .productoFitosanitario(producto)
                .build());

       // 8º — Tratamiento (Ajustado a tu entidad con float y unidades)
        tratamientoRepository.save(Tratamiento.builder()
                .fecha(LocalDate.now())
                .dosis(2.5f)                     // float primitivo
                .unidades("L/ha")                // String obligatorio
                .superficieTratada(12.5)         // double primitivo
                .plagaObjetivo("Mildiu")
                .motivoTratamiento("CU")         // CU = Curativo
                .codigoPlaga("EPPO-MILD")
                .tipoEquipo("PULV_HIDRA")
                .numRegistroIteaf("ITEAF-MAD-01")
                .fechaIteaf(LocalDate.now().minusYears(1))
                .volumenCaldo(BigDecimal.valueOf(400.0)) // Este sí es BigDecimal en tu entidad
                .nifAplicador("12345678Z")
                .numeroRopo("ROPO-28-0001")
                .nivelCapacitacionRopo("02")    // 02 = Cualificado
                .estado("PENDIENTE")
                .validado(false)
                .recinto(recinto)
                .granjero(granjero)
                .productoFitosanitario(producto)
                .aiConfidence(0.95f)            // float para el nivel de confianza
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
            .numReg("ES-00123")
            .principioAct("Captan")
            .dosisMin(BigDecimal.valueOf(1.5))
            .dosisMax(BigDecimal.valueOf(2.5))
            .unidadDosisOficial("kg/ha")
            .activo(true)
            .build());

        productoRepository.save(ProductoFitosanitario.builder()
            .nombre("Glifosato Total")
            .numReg("ES-00789")
            .principioAct("Glifosato")
            .dosisMin(BigDecimal.valueOf(3.0))
            .dosisMax(BigDecimal.valueOf(6.0))
            .unidadDosisOficial("L/ha")
            .activo(true)
            .build());

        productoRepository.save(ProductoFitosanitario.builder()
                .nombre("Abamectina 1.8 EC")
                .principioAct("Abamectina")
                .numReg("ES-01542")
                .cultivosAutori("Cítricos, Manzano, Peral, Tomate")
                .fechaCadu(LocalDate.of(2027, 12, 31))
                .dosisMin(BigDecimal.valueOf(0.5))
                .dosisMax(BigDecimal.valueOf(1.0))
                .unidadDosisOficial("L/ha")
                .activo(true)
                .build());

        log.info("Productos fitosanitarios de prueba creados (Captan, Glifosato, Abamectina).");

    }

}
