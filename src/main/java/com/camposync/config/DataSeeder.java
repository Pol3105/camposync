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
import java.util.List;

/**
 * Pobla la base de datos con datos de prueba realistas para estresar la interfaz.
 * Solo se ejecuta si hay exactamente 1 granjero (el de DataInitializer).
 * Contraseña de todos los granjeros de prueba: campo2024
 */
@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final AuthService                      authService;
    private final AsesoriaRepository               asesoriaRepository;
    private final GranjeroRepository               granjeroRepository;
    private final ExplotacionRepository            explotacionRepository;
    private final ParcelaRepository                parcelaRepository;
    private final RecintoRepository                recintoRepository;
    private final TratamientoRepository            tratamientoRepository;
    private final ProductoFitosanitarioRepository  productoRepository;
    private final InventarioRepository             inventarioRepository;
    private final AplicadorRepository              aplicadorRepository;
    private final EquipamientoRepository           equipamientoRepository;

    private int parcelaSigpacSeq = 1;

    @Override
    @Transactional
    public void run(String... args) {
        if (granjeroRepository.count() > 1) {
            log.info("[DataSeeder] Datos de prueba ya presentes, omitiendo.");
            return;
        }

        Asesoria asesoria = asesoriaRepository.findById(1L)
                .orElseGet(() -> asesoriaRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new IllegalStateException("No existe ninguna asesoría")));

        log.info("[DataSeeder] Poblando la base de datos con datos realistas para '{}'...", asesoria.getNombre());

        seedGranjeros(asesoria);
        List<ProductoFitosanitario> productos = seedProductosExtra();
        seedExplotacionesParcelasInventario(asesoria, productos);

        log.info("[DataSeeder] ✓ 10 granjeros · 25 explotaciones · 50 parcelas · 50 recintos · 20 tratamientos · 50 inventarios · 30 aplicadores · 30 equipamientos creados.");
        log.info("[DataSeeder] Contraseña de todos los granjeros de prueba: campo2024");
    }

    // ── 1. Granjeros ──────────────────────────────────────────────────────────

    private void seedGranjeros(Asesoria asesoria) {
        Long aId = asesoria.getId();
        // registerGranjero(username, rawPassword, nombre, nif, nombreLegal, telefono, cnae, asesoriaId)
        authService.registerGranjero("pedro.alcantara@agrocalatrava.com",  "campo2024", "Pedro Alcántara Fuentes",       "B13000001", "Agro Calatrava S.L.",       "600111222", "0126", aId);
        authService.registerGranjero("maria.vidal@vinedosvidal.com",          "campo2024", "María Dolores Vidal Ramos",     "B13000002", "Viñedos Vidal S.L.",     "611222333", "0121", aId);
        authService.registerGranjero("javier.perez@olivarera.com",        "campo2024", "Francisco Javier Pérez Torres", "B13000003", "Explotación El Llano S.L.", "622333444", "0111", aId);
        authService.registerGranjero("carmen.aguilera@carmengranja.com",       "campo2024", "Carmen Aguilera Muñoz",         "B13000004", "Granja Aguilera S.L.",         "633444555", "0126", aId);
        authService.registerGranjero("romero.herederos@romerogil.com",      "campo2024", "Herederos Romero Gil S.C.",     "G13000005", "Herederos Romero Gil S.C.",     "644555666", "0125", aId);
        authService.registerGranjero("isabel.martinez@pradonuevo.com",       "campo2024", "Isabel Martínez Soria",         "B13000006", "Prado Nuevo S.L.",         "655666777", "0113", aId);
        authService.registerGranjero("antonio.herrero@herreroagro.com",        "campo2024", "Antonio Herrero Blanco",        "B13000007", "Herrero Agropecuaria S.L.",        "666777888", "0111", aId);
        authService.registerGranjero("rosa.jimenez@vinedosdelsol.com",        "campo2024", "Rosa Jiménez Castillo",         "B13000008", "Viñedos Del Sol S.L.",         "677888999", "0128", aId);
        authService.registerGranjero("manuel.guerrero@cerrodeguerrero.com",       "campo2024", "Finca El Cerro de Guerrero",    "B13000009", "Finca El Cerro de Guerrero S.L.", "688999000", "0126", aId);
        authService.registerGranjero("pilar.fuentes@olivaralqueria.com",        "campo2024", "Pilar Fuentes Gallego",         "B13000010", "Olivar Alquería S.L.",         "699000111", "0119", aId);
    }

    // ── 2. Productos fitosanitarios extra (2 más) ──────────────────────────

    private List<ProductoFitosanitario> seedProductosExtra() {
        if (productoRepository.findAll().stream().noneMatch(p -> p.getNombre().contains("Abamectina"))) {
            productoRepository.save(ProductoFitosanitario.builder()
                    .nombre("Abamectina 1.8 EC")
                    .principioAct("Abamectina")
                    .numReg("ES-03344")
                    .cultivosAutori("Almendro,Manzano,Peral,Cítricos,Vid")
                    .dosisMin(new BigDecimal("0.4"))
                    .dosisMax(new BigDecimal("0.8"))
                    .unidadDosisOficial("L/ha")
                    .activo(true)
                    .build());
        }
        if (productoRepository.findAll().stream().noneMatch(p -> p.getNombre().contains("Mancozeb"))) {
            productoRepository.save(ProductoFitosanitario.builder()
                    .nombre("Mancozeb 80% WP")
                    .principioAct("Mancozeb")
                    .numReg("19875")
                    .cultivosAutori("Vid,Manzano,Peral,Olivo")
                    .dosisMin(new BigDecimal("1.5"))
                    .dosisMax(new BigDecimal("3.0"))
                    .unidadDosisOficial("kg/ha")
                    .activo(true)
                    .build());
        }
        return productoRepository.findAll();
    }

    // ── 3. Aplicadores y Equipamiento ────────────────────────────────────────

    private void seedAplicadoresYEquipamiento(Granjero granjero) {
        // Crear 3 Aplicadores con estructura 13-XXXXX-P (Ciudad Real)
        aplicador(granjero, "Manuel García López", "12345678A", "13-12345-P", "CUALIFICADO");
        aplicador(granjero, "José Fernández Sánchez", "87654321B", "13-54321-P", "CUALIFICADO");
        aplicador(granjero, "Antonio Ruiz Martín", "11223344C", "13-98765-P", "CUALIFICADO");

        // Crear 3 Equipamientos completos
        equipamiento(granjero, "13-0948", "Atomizador remolcado", "Hardi Mercury 2000", "ITEAF-13-876");
        equipamiento(granjero, "13-2244", "Pulverizador arrastrado", "Hardi Navigator 3000", "ITEAF-13-123");
        equipamiento(granjero, "13-5566", "Pulverizador suspendido", "Mañez y Lozano Twister", "ITEAF-13-456");
    }

    // ── 4. Explotaciones + Parcelas + Recintos + Inventario + Tratamientos ───

    private void seedExplotacionesParcelasInventario(Asesoria asesoria, List<ProductoFitosanitario> prods) {

        Granjero pedro    = g("pedro.alcantara@agrocalatrava.com");
        Granjero maria    = g("maria.vidal@vinedosvidal.com");
        Granjero fco      = g("javier.perez@olivarera.com");
        Granjero carmen   = g("carmen.aguilera@carmengranja.com");
        Granjero jose     = g("romero.herederos@romerogil.com");
        Granjero isabel   = g("isabel.martinez@pradonuevo.com");
        Granjero antonio  = g("antonio.herrero@herreroagro.com");
        Granjero rosa     = g("rosa.jimenez@vinedosdelsol.com");
        Granjero manuel   = g("manuel.guerrero@cerrodeguerrero.com");
        Granjero pilar    = g("pilar.fuentes@olivaralqueria.com");

        seedAplicadoresYEquipamiento(pedro);
        seedAplicadoresYEquipamiento(maria);
        seedAplicadoresYEquipamiento(fco);
        seedAplicadoresYEquipamiento(carmen);
        seedAplicadoresYEquipamiento(jose);
        seedAplicadoresYEquipamiento(isabel);
        seedAplicadoresYEquipamiento(antonio);
        seedAplicadoresYEquipamiento(rosa);
        seedAplicadoresYEquipamiento(manuel);
        seedAplicadoresYEquipamiento(pilar);

        ProductoFitosanitario cobre = prods.stream().filter(p -> p.getNombre().contains("Cupreox")).findFirst().orElse(prods.get(0));
        ProductoFitosanitario azufre = prods.stream().filter(p -> p.getNombre().contains("Azufre")).findFirst().orElse(prods.get(0));
        ProductoFitosanitario glifosato = prods.stream().filter(p -> p.getNombre().contains("Glifosato")).findFirst().orElse(prods.get(0));
        ProductoFitosanitario abamectina = prods.stream().filter(p -> p.getNombre().contains("Abamectina")).findFirst().orElse(prods.get(0));
        ProductoFitosanitario mancozeb = prods.stream().filter(p -> p.getNombre().contains("Mancozeb")).findFirst().orElse(prods.get(0));

        // ── PEDRO ALCÁNTARA — Daimiel (023) ────────────────────────────────
        Explotacion hoyadelmoro = exp(asesoria, pedro, "Hoya del Moro", "CE", "PF", 45.5f, "SIG-13-023-0-001");
        Recinto r_pedro_1 = pc(hoyadelmoro, "13023A0010002580000JK", 22.0f, "TBL", "SE", "Daimiel");
                            pc(hoyadelmoro, "13023A0010002610000JK", 23.5f, "EB",  "SE", "Daimiel");

        Explotacion carrascal = exp(asesoria, pedro, "Viñedo El Carrascal", "VI", "PF", 12.3f, "SIG-13-023-0-002");
        Recinto r_pedro_2 = pc(carrascal, "13023A0020001120000MR", 6.8f, "VI", "RG", "Daimiel");
                            pc(carrascal, "13023A0020001150000MR", 5.5f, "VI", "SE", "Daimiel");

        Explotacion cortijofrontera = exp(asesoria, pedro, "Cortijo La Frontera", "OL", "PF", 28.0f, "SIG-13-023-0-003");
        pc(cortijofrontera, "13023A0030002300000SL", 14.0f, "OV", "SE", "Daimiel");
        pc(cortijofrontera, "13023A0030002340000SL", 14.0f, "OV", "SE", "Daimiel");

        inv(pedro, mancozeb,    "Fungicida Viña — stock principal",  18.5f);
        inv(pedro, glifosato,   "Herbicida calle viñedo",            10.0f);
        inv(pedro, cobre,       "Caldo bordelés olivo",              25.0f);
        inv(pedro, azufre,      "Azufre para oidio",                 30.0f);
        inv(pedro, abamectina,  "Acaricida viña — Pedro",             5.5f);

        trat(pedro, r_pedro_1, mancozeb,    "PR", "Mildiu de la vid",       "EPPO: PLASVI", LocalDate.of(2024, 4, 10), 2.0f, "kg/ha", true);
        trat(pedro, r_pedro_2, cobre,       "CU", "Repilo del olivo",       "EPPO: REPI1",  LocalDate.of(2024, 5, 15), 3.0f, "kg/ha", false);

        // ── MARÍA DOLORES VIDAL — Valdepeñas (087) ────────────────────────────
        Explotacion valdejudios = exp(asesoria, maria, "Pago Valdejudíos", "VI", "PF", 8.7f, "SIG-13-087-0-004");
        Recinto r_maria_1 = pc(valdejudios, "13087A0010000980000KQ", 4.5f, "VI", "RG", "Valdepeñas");
                            pc(valdejudios, "13087A0010001010000KQ", 4.2f, "VI", "SE", "Valdepeñas");

        Explotacion almendralsierra = exp(asesoria, maria, "Almendral de la Sierra", "FS", "PF", 22.5f, "SIG-13-087-0-005");
        Recinto r_maria_2 = pc(almendralsierra, "13087A0020003400000PR", 11.0f, "FS", "SE", "Valdepeñas");
                            pc(almendralsierra, "13087A0020003440000PR", 11.5f, "FS", "SE", "Valdepeñas");

        Explotacion huertasanmiguel = exp(asesoria, maria, "Huerta San Miguel", "HO", "PF", 6.2f, "SIG-13-087-0-006");
        pc(huertasanmiguel, "13087A0030000650000VW", 3.2f, "TA", "RG", "Valdepeñas");
        pc(huertasanmiguel, "13087A0030000680000VW", 3.0f, "TA", "RG", "Valdepeñas");

        inv(maria, mancozeb,    "Fungicida Tomate — Huerta",     12.0f);
        inv(maria, glifosato,   "Mata-hierbas calles almendro",  15.0f);
        inv(maria, abamectina,  "Veneno araña roja almendro",     6.0f);
        inv(maria, cobre,       "Mildiu viña — María",           20.0f);
        inv(maria, azufre,      "Oidio viña — María",            25.0f);

        trat(maria, r_maria_1, cobre,      "CU", "Repilo del olivo",       "EPPO: REPI1", LocalDate.of(2024, 5, 20), 3.0f, "kg/ha", true);
        trat(maria, r_maria_2, abamectina, "PR", "Araña roja del almendro","EPPO: PANUTE", LocalDate.of(2024, 3, 28), 0.6f, "L/ha", true);

        // ── FRANCISCO JAVIER PÉREZ — Tomelloso (086) ─────────────────────────
        Explotacion lasturras = exp(asesoria, fco, "Las Turras del Llano", "CE", "PF", 120.0f, "SIG-13-086-0-007");
        Recinto r_fco_1 = pc(lasturras, "13086A0010008900000AX", 62.0f, "TDU", "SE", "Tomelloso");
                          pc(lasturras, "13086A0010009100000AX", 58.0f, "GI",  "SE", "Tomelloso");

        Explotacion dehesabaja = exp(asesoria, fco, "Dehesa Baja", "PA", "PF", 85.0f, "SIG-13-086-0-008");
        Recinto r_fco_2 = pc(dehesabaja, "13086A0020006500000BZ", 42.0f, "PR", "SE", "Tomelloso");
                          pc(dehesabaja, "13086A0020006800000BZ", 43.0f, "PR", "SE", "Tomelloso");

        inv(fco, glifosato,   "Herbicida total cereal — stock",  30.0f);
        inv(fco, cobre,       "Tratamiento preventivo viña",     10.0f);
        inv(fco, abamectina,  "Acaricida pastos",                 3.5f);
        inv(fco, azufre,      "Tratamiento oidio Tomelloso",     15.0f);

        trat(fco, r_fco_1, glifosato,   "PR", "Malas hierbas cereal",  "EPPO: POAAN", LocalDate.of(2024, 2, 15), 3.5f, "L/ha", false);
        trat(fco, r_fco_2, azufre,      "CU", "Oidio de la vid",       "EPPO: OIDI1", LocalDate.of(2024, 4, 5), 1.5f, "kg/ha", true);

        // ── CARMEN AGUILERA — Daimiel (023) ────────────────────────────────
        Explotacion molinoviejo = exp(asesoria, carmen, "Olivar Molino Viejo", "OL", "PF", 35.5f, "SIG-13-023-0-009");
        Recinto r_carmen_1 = pc(molinoviejo, "13023A0040003800000CL", 18.0f, "OV", "SE", "Daimiel");
                             pc(molinoviejo, "13023A0040003840000CL", 17.5f, "OV", "SE", "Daimiel");

        Explotacion terrerosaltos = exp(asesoria, carmen, "Los Terreros Altos", "CE", "PF", 60.0f, "SIG-13-023-0-010");
        Recinto r_carmen_2 = pc(terrerosaltos, "13023A0050005200000DM", 30.0f, "TBL", "SE", "Daimiel");
                             pc(terrerosaltos, "13023A0050005250000DM", 30.0f, "AV",  "SE", "Daimiel");

        Explotacion elmendral = exp(asesoria, carmen, "El Almendral", "FS", "PF", 15.5f, "SIG-13-023-0-011");
        pc(elmendral, "13023A0060001400000EN", 8.0f, "FS", "SE", "Daimiel");
        pc(elmendral, "13023A0060001430000EN", 7.5f, "FS", "SE", "Daimiel");

        inv(carmen, cobre,       "Repaso olivo — Tratamiento 1",   22.0f);
        inv(carmen, glifosato,   "Herbicida suelo olivar",          18.0f);
        inv(carmen, abamectina,  "Acaricida almendro primavera",     7.0f);
        inv(carmen, azufre,      "Fungicida preventivo",            14.0f);

        trat(carmen, r_carmen_1, cobre,       "PR", "Repilo del olivo",    "EPPO: REPI1", LocalDate.of(2024, 3, 10), 2.5f, "kg/ha", true);
        trat(carmen, r_carmen_2, glifosato,   "PR", "Malas hierbas cereal","EPPO: POAAN", LocalDate.of(2024, 2, 20), 4.0f, "L/ha", true);

        // ── JOSÉ ANTONIO ROMERO — Valdepeñas (087) ────────────────────────────
        Explotacion fincasanisidro = exp(asesoria, jose, "Finca San Isidro", "CE", "SC", 55.0f, "SIG-13-087-0-012");
        Recinto r_jose_1 = pc(fincasanisidro, "13087A0010004800000FP", 28.0f, "TDU", "SE", "Valdepeñas");
                           pc(fincasanisidro, "13087A0010004850000FP", 27.0f, "EB",  "SE", "Valdepeñas");

        Explotacion vinasalcaide = exp(asesoria, jose, "Las Viñas del Alcaide", "VI", "SC", 18.5f, "SIG-13-087-0-013");
        Recinto r_jose_2 = pc(vinasalcaide, "13087A0020002100000GQ", 9.5f, "VI", "RG", "Valdepeñas");
                           pc(vinasalcaide, "13087A0020002140000GQ", 9.0f, "VI", "SE", "Valdepeñas");

        inv(jose, glifosato,   "Herbicida cereal — Romero",    25.0f);
        inv(jose, cobre,       "Mildiu viña septiembre",        16.0f);
        inv(jose, abamectina,  "Araña roja viñedo S.C.",         4.0f);
        inv(jose, azufre,      "Azufre oidio viña",             20.0f);

        trat(jose, r_jose_1, glifosato, "PR", "Malas hierbas cereal",  "EPPO: POAAN", LocalDate.of(2024, 3, 5),  3.0f, "L/ha", false);
        trat(jose, r_jose_2, azufre,    "CU", "Oidio de la vid",       "EPPO: OIDI1", LocalDate.of(2024, 6, 10), 1.5f, "kg/ha", true);

        // ── ISABEL MARTÍNEZ — Tomelloso (086) ────────────────────────────────
        Explotacion pradonuevo = exp(asesoria, isabel, "Prado Nuevo", "OL", "PF", 40.0f, "SIG-13-086-0-014");
        Recinto r_isabel_1 = pc(pradonuevo, "13086A0010003900000HR", 20.0f, "OV", "SE", "Tomelloso");
                             pc(pradonuevo, "13086A0010003950000HR", 20.0f, "OV", "SE", "Tomelloso");

        Explotacion almendrovega = exp(asesoria, isabel, "El Almendro de la Vega", "FS", "PF", 25.0f, "SIG-13-086-0-015");
        Recinto r_isabel_2 = pc(almendrovega, "13086A0020002800000IS", 13.0f, "FS", "SE", "Tomelloso");
                             pc(almendrovega, "13086A0020002840000IS", 12.0f, "FS", "SE", "Tomelloso");

        Explotacion laholanda = exp(asesoria, isabel, "La Holanda", "CE", "PF", 75.5f, "SIG-13-086-0-016");
        pc(laholanda, "13086A0030006800000JT", 38.0f, "TBL", "SE", "Tomelloso");
        pc(laholanda, "13086A0030006850000JT", 37.5f, "GI",  "RG", "Tomelloso");

        inv(isabel, cobre,       "Repaso olivo Isabel — P. Nuevo",  28.0f);
        inv(isabel, glifosato,   "Herbicida rodales olivar",        22.0f);
        inv(isabel, abamectina,  "Veneno araña almendro — Isabel",   5.5f);
        inv(isabel, azufre,      "Fungicida oidio",                 15.0f);

        trat(isabel, r_isabel_1, cobre,      "CU", "Repilo del olivo",      "EPPO: REPI1",  LocalDate.of(2024, 4, 18), 3.0f, "kg/ha", true);
        trat(isabel, r_isabel_2, abamectina, "PR", "Araña roja del almendro","EPPO: PANUTE", LocalDate.of(2024, 3, 22), 0.5f, "L/ha", true);

        // ── ANTONIO HERRERO — Daimiel (023) ────────────────────────────────
        Explotacion hazasdelmonte = exp(asesoria, antonio, "Las Hazas del Monte", "CE", "PF", 90.0f, "SIG-13-023-0-017");
        Recinto r_antonio_1 = pc(hazasdelmonte, "13023A0010007900000KU", 45.0f, "TDU", "SE", "Daimiel");
                              pc(hazasdelmonte, "13023A0010008000000KU", 45.0f, "EB",  "SE", "Daimiel");

        Explotacion huertanoria = exp(asesoria, antonio, "Huerta La Noria", "HO", "PF", 5.5f, "SIG-13-023-0-018");
        Recinto r_antonio_2 = pc(huertanoria, "13023A0020000480000LV", 2.8f, "TA", "RG", "Daimiel");
                              pc(huertanoria, "13023A0020000510000LV", 2.7f, "TA", "RG", "Daimiel");

        inv(antonio, glifosato,   "Herbicida cereal secano — Herrero", 35.0f);
        inv(antonio, cobre,       "Prevención mildiu pepino",           11.0f);
        inv(antonio, abamectina,  "Minador hoja pepino invernadero",     4.5f);
        inv(antonio, azufre,      "Fungicida preventivo oidio",         10.0f);

        trat(antonio, r_antonio_1, glifosato, "PR", "Malas hierbas cereal",    "EPPO: POAAN",  LocalDate.of(2024, 2, 8),  4.0f, "L/ha", false);
        trat(antonio, r_antonio_2, azufre,    "CU", "Oidio de las hortícolas",  "EPPO: OIDI1", LocalDate.of(2024, 5, 25), 2.0f, "kg/ha", true);

        // ── ROSA JIMÉNEZ — Valdepeñas (087) ───────────────────────────────────
        Explotacion almendrosronda = exp(asesoria, rosa, "Almendros de Ronda", "FS", "PF", 20.0f, "SIG-13-087-0-019");
        Recinto r_rosa_1 = pc(almendrosronda, "13087A0010002000000MW", 10.0f, "FS", "SE", "Valdepeñas");
                           pc(almendrosronda, "13087A0010002040000MW", 10.0f, "FS", "SE", "Valdepeñas");

        Explotacion vinedossol = exp(asesoria, rosa, "Viñedos del Sol", "VI", "PF", 14.5f, "SIG-13-087-0-020");
        Recinto r_rosa_2 = pc(vinedossol, "13087A0020001500000NX", 7.5f, "VI", "RG", "Valdepeñas");
                           pc(vinedossol, "13087A0020001540000NX", 7.0f, "VI", "SE", "Valdepeñas");

        Explotacion olivarfrailes = exp(asesoria, rosa, "El Olivar de Frailes", "OL", "PF", 32.0f, "SIG-13-087-0-021");
        pc(olivarfrailes, "13087A0030003200000OY", 16.0f, "OV", "SE", "Valdepeñas");
        pc(olivarfrailes, "13087A0030003240000OY", 16.0f, "OV", "SE", "Valdepeñas");

        inv(rosa, abamectina,  "Araña roja almendro — Rosa",    8.0f);
        inv(rosa, cobre,       "Mildiu viña — Jiménez",         18.0f);
        inv(rosa, glifosato,   "Herbicida olivo — Frailes",     20.0f);
        inv(rosa, azufre,      "Oidio viña — Jiménez",          22.0f);

        trat(rosa, r_rosa_1, abamectina, "PR", "Araña roja del almendro","EPPO: PANUTE", LocalDate.of(2024, 4, 2),  0.6f, "L/ha", true);
        trat(rosa, r_rosa_2, azufre,      "CU", "Oidio de la vid",       "EPPO: OIDI1",  LocalDate.of(2024, 5, 30), 3.5f, "kg/ha", true);

        // ── MANUEL GUERRERO — Tomelloso (086) ────────────────────────────────
        Explotacion dehesagrande = exp(asesoria, manuel, "La Dehesa Grande", "PA", "PF", 110.0f, "SIG-13-086-0-022");
        Recinto r_manuel_1 = pc(dehesagrande, "13086A0010009800000PZ", 55.0f, "PR", "SE", "Tomelloso");
                             pc(dehesagrande, "13086A0010009900000PZ", 55.0f, "PR", "SE", "Tomelloso");

        Explotacion cerrosberrocal = exp(asesoria, manuel, "Cerros Berrocal", "CE", "PF", 50.0f, "SIG-13-086-0-023");
        Recinto r_manuel_2 = pc(cerrosberrocal, "13086A0020004500000QA", 25.0f, "TBL", "SE", "Tomelloso");
                             pc(cerrosberrocal, "13086A0020004550000QA", 25.0f, "CE",  "SE", "Tomelloso");

        inv(manuel, glifosato,   "Herbicida cereal — El Cerro",    28.0f);
        inv(manuel, cobre,       "Prevención enfermedades cereal",  9.0f);
        inv(manuel, abamectina,  "Control plagas pastizal",         3.0f);
        inv(manuel, azufre,      "Fungicida oidio pastos",         12.0f);

        trat(manuel, r_manuel_1, cobre,      "CU", "Repilo del olivo",     "EPPO: REPI1",  LocalDate.of(2024, 7, 8),  1.5f, "kg/ha", true);
        trat(manuel, r_manuel_2, glifosato,   "PR", "Malas hierbas cereal","EPPO: POAAN",  LocalDate.of(2024, 2, 28), 3.5f, "L/ha", false);

        // ── PILAR FUENTES — Daimiel (023) ──────────────────────────────────
        Explotacion olivaralqueria = exp(asesoria, pilar, "Olivar Alquería", "OL", "PF", 38.5f, "SIG-13-023-0-024");
        Recinto r_pilar_1 = pc(olivaralqueria, "13023A0010003700000RB", 19.0f, "OV", "SE", "Daimiel");
                            pc(olivaralqueria, "13023A0010003750000RB", 19.5f, "OV", "SE", "Daimiel");

        Explotacion dehesafuentes = exp(asesoria, pilar, "Dehesa Fuentes", "PA", "PF", 95.0f, "SIG-13-023-0-025");
        Recinto r_pilar_2 = pc(dehesafuentes, "13023A0020008500000SC", 48.0f, "PR", "SE", "Daimiel");
                            pc(dehesafuentes, "13023A0020008600000SC", 47.0f, "PR", "SE", "Daimiel");

        inv(pilar, cobre,       "Repaso olivo — Alquería",          24.0f);
        inv(pilar, glifosato,   "Herbicida suelo olivar seco",      16.0f);
        inv(pilar, abamectina,  "Acaricida olivo Pilar",             5.0f);
        inv(pilar, azufre,      "Fungicida oidio preventivo Pilar", 10.0f);

        trat(pilar, r_pilar_1, cobre,       "CU", "Repilo del olivo",  "EPPO: REPI1", LocalDate.of(2024, 4, 25), 2.5f, "kg/ha", true);
        trat(pilar, r_pilar_2, cobre,       "CU", "Repilo del olivo",  "EPPO: REPI1", LocalDate.of(2024, 7, 15), 1.0f, "kg/ha", true);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private void aplicador(Granjero g, String nombre, String nif, String numeroRopo, String nivelCapacitacion) {
        aplicadorRepository.save(Aplicador.builder()
                .nombre(nombre)
                .nif(nif)
                .numeroRopo(numeroRopo)
                .nivelCapacitacion(nivelCapacitacion)
                .granjero(g)
                .build());
    }

    private void equipamiento(Granjero g, String alias, String tipoMaquina, String marcaModelo, String numRegistroIteaf) {
        equipamientoRepository.save(Equipamiento.builder()
                .alias(alias)
                .tipoMaquina(tipoMaquina)
                .marcaModelo(marcaModelo)
                .numRegistroIteaf(numRegistroIteaf)
                .granjero(g)
                .build());
    }

    private Granjero g(String username) {
        return granjeroRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Granjero no encontrado: " + username));
    }

    /** orientacion = 2-char SIEX code (CE/VI/OL/FS/HO/PA/OT), tipo = PF/SC/SA/SL */
    private Explotacion exp(Asesoria a, Granjero g, String nombre, String orientacion, String tipo, float ha, String refSig) {
        String[] parts   = refSig.split("-");
        String provCod   = parts[1];
        String munCod    = parts[2];
        int    seq       = Integer.parseInt(parts[4]);
        String codigoRea = "ES" + provCod + munCod + String.format("%04d", seq);
        return explotacionRepository.save(Explotacion.builder()
                .nombre(nombre)
                .refSig(refSig)
                .superficieTotal(BigDecimal.valueOf(ha))
                .estado("ACTIVA")
                .codigoRea(codigoRea)
                .tipoExplotacion(tipo)
                .orientacionProductiva(orientacion)
                .provinciaExplotacion(provCod)
                .municipioExplotacion(munCod)
                .anioDeclaracion(2024)
                .asesoria(a)
                .granjero(g)
                .build());
    }

    /** Crea una Parcela con datos SIGPAC completos y un Recinto por defecto (recinto 1). */
    private Recinto pc(Explotacion e, String refCatastral, float superficie, String usoSigpac,
                       String sistemaCultivo, String municipio) {
        String provCod        = refCatastral.substring(0, 2);
        String provinciaNombre = provToNombre(provCod);
        int    poligono       = (parcelaSigpacSeq - 1) / 5 + 1;
        int    sigpacNum      = parcelaSigpacSeq++;
        Parcela parcela = parcelaRepository.save(Parcela.builder()
                .refCatastral(refCatastral)
                .municipio(municipio)
                .provincia(provinciaNombre)
                .poligono(poligono)
                .parcelaSigpac(sigpacNum)
                .agregado(0)
                .zona(0)
                .explotacion(e)
                .build());
        return recintoRepository.save(Recinto.builder()
                .numeroRecinto(1)
                .superficie(BigDecimal.valueOf(superficie))
                .usoSigpac(usoSigpac)
                .sistemaCultivo(sistemaCultivo)
                .cultivo(mapUsoToFegaCultivo(usoSigpac))
                .parcela(parcela)
                .build());
    }

    private void trat(Granjero g, Recinto r, ProductoFitosanitario p,
                      String motivo, String plagaTexto, String eppoCode,
                      LocalDate fecha, float dosis, String unidades,
                      boolean validado) {
        double superficie = r.getSuperficie() != null ? r.getSuperficie().doubleValue() : 0.0;

        List<Aplicador> aplicadores = aplicadorRepository.findAll();
        Aplicador aplicador = aplicadores.stream().filter(a -> a.getGranjero().getId().equals(g.getId())).findFirst().orElse(null);

        List<Equipamiento> equipamientos = equipamientoRepository.findAll();
        Equipamiento equipamiento = equipamientos.stream().filter(e -> e.getGranjero().getId().equals(g.getId())).findFirst().orElse(null);

        // Fallback robusto para garantizar datos completos
        if (aplicador == null) {
            aplicador = aplicadorRepository.save(Aplicador.builder()
                    .nombre("Manuel García López")
                    .nif("12345678A")
                    .numeroRopo("13-12345-P")
                    .nivelCapacitacion("CUALIFICADO")
                    .granjero(g)
                    .build());
        }

        if (equipamiento == null) {
            equipamiento = equipamientoRepository.save(Equipamiento.builder()
                    .alias("13-0948")
                    .tipoMaquina("Atomizador remolcado")
                    .marcaModelo("Hardi Mercury 2000")
                    .numRegistroIteaf("ITEAF-13-876")
                    .granjero(g)
                    .build());
        }

        tratamientoRepository.save(Tratamiento.builder()
                .fecha(fecha)
                .dosis(dosis)
                .unidades(unidades)
                .superficieTratada(superficie)
                .plagaObjetivo(plagaTexto)
                .motivoTratamiento(motivo)
                .codigoPlaga(eppoCode)
                .volumenCaldo(new BigDecimal("200.00"))
                .estado(validado ? "VALIDADO" : "PENDIENTE")
                .validado(validado)
                .aiConfidence(0f)
                .recinto(r)
                .granjero(g)
                .productoFitosanitario(p)
                .aplicador(aplicador)
                .equipamiento(equipamiento)
                .build());
    }

    private void inv(Granjero g, ProductoFitosanitario p, String alias, float stock) {
        inventarioRepository.save(Inventario.builder()
                .aliasAgric(alias)
                .stockAct(stock)
                .granjero(g)
                .productoFitosanitario(p)
                .build());
    }

    private String provToNombre(String cod) {
        return switch (cod) {
            case "13" -> "Ciudad Real";
            case "02" -> "Albacete";
            case "06" -> "Badajoz";
            case "10" -> "Cáceres";
            case "14" -> "Córdoba";
            case "23" -> "Jaén";
            case "29" -> "Málaga";
            default   -> "España";
        };
    }

    private String mapUsoToFegaCultivo(String uso) {
        return switch (uso) {
            case "VI" -> "Viñedo de transformación";
            case "OV" -> "Olivar";
            case "TBL" -> "Cebada de dos carreras";
            case "EB" -> "Cereal de invierno";
            case "FS" -> "Almendro";
            case "TA" -> "Hortícolas";
            case "PR" -> "Pastizal";
            case "GI" -> "Girasol";
            default -> "Olivar";
        };
    }
}
