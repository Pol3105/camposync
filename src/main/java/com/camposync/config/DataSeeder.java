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
    private final ProductoFitosanitarioRepository  productoRepository;
    private final InventarioRepository             inventarioRepository;

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

        log.info("[DataSeeder] ✓ 10 granjeros · 25 explotaciones · 50 parcelas · 50 recintos · 50 inventarios creados.");
        log.info("[DataSeeder] Contraseña de todos los granjeros de prueba: campo2024");
    }

    // ── 1. Granjeros ──────────────────────────────────────────────────────────

    private void seedGranjeros(Asesoria asesoria) {
        Long aId = asesoria.getId();
        authService.registerGranjero("pedro.alcantara",  "campo2024", "Pedro Alcántara Fuentes",       "0126", aId);
        authService.registerGranjero("m.vidal",          "campo2024", "María Dolores Vidal Ramos",     "0121", aId);
        authService.registerGranjero("fco.perez",        "campo2024", "Francisco Javier Pérez Torres", "0111", aId);
        authService.registerGranjero("c.aguilera",       "campo2024", "Carmen Aguilera Muñoz",         "0126", aId);
        authService.registerGranjero("jose.romero",      "campo2024", "Herederos Romero Gil S.C.",     "0125", aId);
        authService.registerGranjero("i.martinez",       "campo2024", "Isabel Martínez Soria",         "0113", aId);
        authService.registerGranjero("a.herrero",        "campo2024", "Antonio Herrero Blanco",        "0111", aId);
        authService.registerGranjero("r.jimenez",        "campo2024", "Rosa Jiménez Castillo",         "0128", aId);
        authService.registerGranjero("m.guerrero",       "campo2024", "Finca El Cerro de Guerrero",    "0126", aId);
        authService.registerGranjero("p.fuentes",        "campo2024", "Pilar Fuentes Gallego",         "0119", aId);
    }

    // ── 2. Productos fitosanitarios extra (2 más → 5 en total) ───────────────

    private List<ProductoFitosanitario> seedProductosExtra() {
        if (productoRepository.count() < 5) {
            productoRepository.save(ProductoFitosanitario.builder()
                    .nombre("Cobre Oxicloruro 50 WP")
                    .principioAct("Oxicloruro de cobre")
                    .numReg("ES-01122")
                    .cultivosAutori("Olivo,Vid,Patata,Tomate,Pepino")
                    .activo(true)
                    .build());

            productoRepository.save(ProductoFitosanitario.builder()
                    .nombre("Abamectina 1.8 EC")
                    .principioAct("Abamectina")
                    .numReg("ES-03344")
                    .cultivosAutori("Almendro,Manzano,Peral,Cítricos,Ornamentales")
                    .activo(true)
                    .build());
        }
        return productoRepository.findAll();
    }

    // ── 3. Explotaciones + Parcelas + Recintos + Inventario ──────────────────

    private void seedExplotacionesParcelasInventario(Asesoria asesoria, List<ProductoFitosanitario> prods) {

        Granjero pedro    = g("pedro.alcantara");
        Granjero maria    = g("m.vidal");
        Granjero fco      = g("fco.perez");
        Granjero carmen   = g("c.aguilera");
        Granjero jose     = g("jose.romero");
        Granjero isabel   = g("i.martinez");
        Granjero antonio  = g("a.herrero");
        Granjero rosa     = g("r.jimenez");
        Granjero manuel   = g("m.guerrero");
        Granjero pilar    = g("p.fuentes");

        ProductoFitosanitario captan      = prods.get(0);
        ProductoFitosanitario clorpirifos = prods.get(1);
        ProductoFitosanitario glifosato   = prods.get(2);
        ProductoFitosanitario cobre       = prods.size() > 3 ? prods.get(3) : captan;
        ProductoFitosanitario abamectina  = prods.size() > 4 ? prods.get(4) : clorpirifos;

        // ── PEDRO ALCÁNTARA — 3 explotaciones ────────────────────────────────
        Explotacion hoyadelmoro = exp(asesoria, pedro, "Hoya del Moro", "Cereal", 45.5f, "SIG-14-077-0-001");
        pc(hoyadelmoro, "14077A0010002580000JK", 22.0f, "TBL", "SE", "Montoro");
        pc(hoyadelmoro, "14077A0010002610000JK", 23.5f, "EB",  "SE", "Montoro");

        Explotacion carrascal = exp(asesoria, pedro, "Viñedo El Carrascal", "Viñedo", 12.3f, "SIG-14-077-0-002");
        pc(carrascal, "14077A0020001120000MR", 6.8f,  "VI", "RG", "Montilla");
        pc(carrascal, "14077A0020001150000MR", 5.5f,  "VI", "SE", "Montilla");

        Explotacion cortijofrontera = exp(asesoria, pedro, "Cortijo La Frontera", "Olivar", 28.0f, "SIG-14-021-0-003");
        pc(cortijofrontera, "14021A0030002300000SL", 14.0f, "OV", "SE", "Aguilar de la Frontera");
        pc(cortijofrontera, "14021A0030002340000SL", 14.0f, "OV", "SE", "Aguilar de la Frontera");

        inv(pedro, captan,      "Fungicida Viña — stock principal",  18.5f);
        inv(pedro, glifosato,   "Herbicida calle viñedo",            10.0f);
        inv(pedro, cobre,       "Caldo bordelés olivo",              25.0f);
        inv(pedro, clorpirifos, "Insecticida olivo (mosca)",          8.0f);
        inv(pedro, abamectina,  "Acaricida viña — Pedro",             5.5f);

        // ── MARÍA DOLORES VIDAL — 3 explotaciones ────────────────────────────
        Explotacion valdejudios = exp(asesoria, maria, "Pago Valdejudíos", "Viñedo", 8.7f, "SIG-14-022-0-004");
        pc(valdejudios, "14022A0010000980000KQ", 4.5f, "VI", "RG", "Lucena");
        pc(valdejudios, "14022A0010001010000KQ", 4.2f, "VI", "SE", "Lucena");

        Explotacion almendralsierra = exp(asesoria, maria, "Almendral de la Sierra", "Almendro", 22.5f, "SIG-14-022-0-005");
        pc(almendralsierra, "14022A0020003400000PR", 11.0f, "FS", "SE", "Cabra");
        pc(almendralsierra, "14022A0020003440000PR", 11.5f, "FS", "SE", "Cabra");

        Explotacion huertasanmiguel = exp(asesoria, maria, "Huerta San Miguel", "Hortícola", 6.2f, "SIG-14-022-0-006");
        pc(huertasanmiguel, "14022A0030000650000VW", 3.2f, "TA", "RG", "Lucena");
        pc(huertasanmiguel, "14022A0030000680000VW", 3.0f, "TA", "RG", "Lucena");

        inv(maria, captan,      "Fungicida Tomate — Huerta",     12.0f);
        inv(maria, glifosato,   "Mata-hierbas calles almendro",  15.0f);
        inv(maria, abamectina,  "Veneno araña roja almendro",     6.0f);
        inv(maria, cobre,       "Mildiu viña — María",           20.0f);
        inv(maria, clorpirifos, "Gusano tomate invernadero",      4.5f);

        // ── FRANCISCO JAVIER PÉREZ — 2 explotaciones ─────────────────────────
        Explotacion lasturras = exp(asesoria, fco, "Las Turras del Llano", "Cereal", 120.0f, "SIG-02-021-0-007");
        pc(lasturras, "02021A0010008900000AX", 62.0f, "TDU", "SE", "Hellín");
        pc(lasturras, "02021A0010009100000AX", 58.0f, "GI",  "SE", "Hellín");

        Explotacion dehesabaja = exp(asesoria, fco, "Dehesa Baja", "Pastizal", 85.0f, "SIG-02-021-0-008");
        pc(dehesabaja, "02021A0020006500000BZ", 42.0f, "PR", "SE", "Almansa");
        pc(dehesabaja, "02021A0020006800000BZ", 43.0f, "PR", "SE", "Almansa");

        inv(fco, glifosato,   "Herbicida total cereal — stock",  30.0f);
        inv(fco, clorpirifos, "Insecticida cereal general",      20.0f);
        inv(fco, captan,      "Fungicida cebada",                 8.0f);
        inv(fco, cobre,       "Tratamiento preventivo viña",     10.0f);
        inv(fco, abamectina,  "Acaricida ganadería",              3.5f);

        // ── CARMEN AGUILERA — 3 explotaciones ────────────────────────────────
        Explotacion molinoviejo = exp(asesoria, carmen, "Olivar Molino Viejo", "Olivar de secano", 35.5f, "SIG-14-077-0-009");
        pc(molinoviejo, "14077A0040003800000CL", 18.0f, "OV", "SE", "Baena");
        pc(molinoviejo, "14077A0040003840000CL", 17.5f, "OV", "SE", "Baena");

        Explotacion terrerosaltos = exp(asesoria, carmen, "Los Terreros Altos", "Cereal", 60.0f, "SIG-14-077-0-010");
        pc(terrerosaltos, "14077A0050005200000DM", 30.0f, "TBL", "SE", "Luque");
        pc(terrerosaltos, "14077A0050005250000DM", 30.0f, "AV",  "SE", "Luque");

        Explotacion elmendral = exp(asesoria, carmen, "El Almendral", "Almendro", 15.5f, "SIG-14-077-0-011");
        pc(elmendral, "14077A0060001400000EN", 8.0f, "FS", "SE", "Castro del Río");
        pc(elmendral, "14077A0060001430000EN", 7.5f, "FS", "SE", "Castro del Río");

        inv(carmen, cobre,       "Repaso olivo — Tratamiento 1",   22.0f);
        inv(carmen, glifosato,   "Herbicida suelo olivar",          18.0f);
        inv(carmen, clorpirifos, "Mosca olivo — Carmen",            12.0f);
        inv(carmen, abamectina,  "Acaricida almendro primavera",     7.0f);
        inv(carmen, captan,      "Fungicida almendro monilia",      14.0f);

        // ── JOSÉ ANTONIO ROMERO — 2 explotaciones ────────────────────────────
        Explotacion fincasanisidro = exp(asesoria, jose, "Finca San Isidro", "Cereal", 55.0f, "SIG-23-020-0-012");
        pc(fincasanisidro, "23020A0010004800000FP", 28.0f, "TDU", "SE", "Jaén");
        pc(fincasanisidro, "23020A0010004850000FP", 27.0f, "EB",  "SE", "Jaén");

        Explotacion vinasalcaide = exp(asesoria, jose, "Las Viñas del Alcaide", "Viñedo", 18.5f, "SIG-23-020-0-013");
        pc(vinasalcaide, "23020A0020002100000GQ", 9.5f, "VI", "RG", "Martos");
        pc(vinasalcaide, "23020A0020002140000GQ", 9.0f, "VI", "SE", "Martos");

        inv(jose, glifosato,   "Herbicida cereal — Romero",    25.0f);
        inv(jose, clorpirifos, "Plaga viña — José Antonio",    10.0f);
        inv(jose, captan,      "Fungicida oidio viña",          9.0f);
        inv(jose, cobre,       "Mildiu viña septiembre",        16.0f);
        inv(jose, abamectina,  "Araña roja viñedo S.C.",         4.0f);

        // ── ISABEL MARTÍNEZ — 3 explotaciones ────────────────────────────────
        Explotacion pradonuevo = exp(asesoria, isabel, "Olivar de Secano Prado Nuevo", "Olivar de secano", 40.0f, "SIG-23-050-0-014");
        pc(pradonuevo, "23050A0010003900000HR", 20.0f, "OV", "SE", "Úbeda");
        pc(pradonuevo, "23050A0010003950000HR", 20.0f, "OV", "SE", "Úbeda");

        Explotacion almendrovega = exp(asesoria, isabel, "El Almendro de la Vega", "Almendro", 25.0f, "SIG-23-050-0-015");
        pc(almendrovega, "23050A0020002800000IS", 13.0f, "FS", "SE", "Baeza");
        pc(almendrovega, "23050A0020002840000IS", 12.0f, "FS", "SE", "Baeza");

        Explotacion laholanda = exp(asesoria, isabel, "La Holanda", "Cereal", 75.5f, "SIG-23-050-0-016");
        pc(laholanda, "23050A0030006800000JT", 38.0f, "TBL", "SE", "Andújar");
        pc(laholanda, "23050A0030006850000JT", 37.5f, "GI",  "RG", "Andújar");

        inv(isabel, cobre,       "Repaso olivo Isabel — P. Nuevo",  28.0f);
        inv(isabel, glifosato,   "Herbicida rodales olivar",        22.0f);
        inv(isabel, abamectina,  "Veneno araña almendro — Isabel",   5.5f);
        inv(isabel, clorpirifos, "Barrenillo olivo primavera",      14.0f);
        inv(isabel, captan,      "Fungicida cereal — La Holanda",    8.0f);

        // ── ANTONIO HERRERO — 2 explotaciones ────────────────────────────────
        Explotacion hazasdelmonte = exp(asesoria, antonio, "Las Hazas del Monte", "Cereal", 90.0f, "SIG-06-015-0-017");
        pc(hazasdelmonte, "06015A0010007900000KU", 45.0f, "TDU", "SE", "Mérida");
        pc(hazasdelmonte, "06015A0010008000000KU", 45.0f, "EB",  "SE", "Mérida");

        Explotacion huertanoria = exp(asesoria, antonio, "Huerta La Noria", "Hortícola", 5.5f, "SIG-06-015-0-018");
        pc(huertanoria, "06015A0020000480000LV", 2.8f, "TA", "RG", "Don Benito");
        pc(huertanoria, "06015A0020000510000LV", 2.7f, "TA", "RG", "Don Benito");

        inv(antonio, glifosato,   "Herbicida cereal secano — Herrero", 35.0f);
        inv(antonio, clorpirifos, "Pulgón cereal general",              16.0f);
        inv(antonio, captan,      "Fungicida huerta tomate",             7.0f);
        inv(antonio, cobre,       "Prevención mildiu pepino",           11.0f);
        inv(antonio, abamectina,  "Minador hoja pepino invernadero",     4.5f);

        // ── ROSA JIMÉNEZ — 3 explotaciones ───────────────────────────────────
        Explotacion almendrosronda = exp(asesoria, rosa, "Almendros de Ronda", "Almendro", 20.0f, "SIG-29-080-0-019");
        pc(almendrosronda, "29080A0010002000000MW", 10.0f, "FS", "SE", "Ronda");
        pc(almendrosronda, "29080A0010002040000MW", 10.0f, "FS", "SE", "Ronda");

        Explotacion vinedossol = exp(asesoria, rosa, "Viñedos del Sol", "Viñedo", 14.5f, "SIG-29-080-0-020");
        pc(vinedossol, "29080A0020001500000NX", 7.5f, "VI", "RG", "Vélez-Málaga");
        pc(vinedossol, "29080A0020001540000NX", 7.0f, "VI", "SE", "Vélez-Málaga");

        Explotacion olivarfrailes = exp(asesoria, rosa, "El Olivar de los Frailes", "Olivar", 32.0f, "SIG-29-080-0-021");
        pc(olivarfrailes, "29080A0030003200000OY", 16.0f, "OV", "SE", "Coín");
        pc(olivarfrailes, "29080A0030003240000OY", 16.0f, "OV", "SE", "Coín");

        inv(rosa, abamectina,  "Araña roja almendro — Rosa",    8.0f);
        inv(rosa, captan,      "Monilia almendro primavera",    15.0f);
        inv(rosa, cobre,       "Mildiu viña — Jiménez",         18.0f);
        inv(rosa, glifosato,   "Herbicida olivo — Frailes",     20.0f);
        inv(rosa, clorpirifos, "Mosca olivo verano",             9.0f);

        // ── MANUEL GUERRERO — 2 explotaciones ────────────────────────────────
        Explotacion dehesagrande = exp(asesoria, manuel, "La Dehesa Grande", "Pastizal", 110.0f, "SIG-10-030-0-022");
        pc(dehesagrande, "10030A0010009800000PZ", 55.0f, "PR", "SE", "Cáceres");
        pc(dehesagrande, "10030A0010009900000PZ", 55.0f, "PR", "SE", "Cáceres");

        Explotacion cerrosberrocal = exp(asesoria, manuel, "Los Cerros del Berrocal", "Cereal", 50.0f, "SIG-10-030-0-023");
        pc(cerrosberrocal, "10030A0020004500000QA", 25.0f, "TBL", "SE", "Trujillo");
        pc(cerrosberrocal, "10030A0020004550000QA", 25.0f, "CE",  "SE", "Trujillo");

        inv(manuel, glifosato,   "Herbicida cereal — El Cerro",    28.0f);
        inv(manuel, clorpirifos, "Insecticida general dehesa",     18.0f);
        inv(manuel, captan,      "Fungicida cereal berrocal",       6.0f);
        inv(manuel, cobre,       "Prevención enfermedades cereal",  9.0f);
        inv(manuel, abamectina,  "Control plagas pastizal",         3.0f);

        // ── PILAR FUENTES — 2 explotaciones ──────────────────────────────────
        Explotacion olivaralqueria = exp(asesoria, pilar, "Olivar de la Alquería", "Olivar de secano", 38.5f, "SIG-06-060-0-024");
        pc(olivaralqueria, "06060A0010003700000RB", 19.0f, "OV", "SE", "Olivenza");
        pc(olivaralqueria, "06060A0010003750000RB", 19.5f, "OV", "SE", "Olivenza");

        Explotacion dehesafuentes = exp(asesoria, pilar, "La Dehesa de Fuentes", "Pastizal", 95.0f, "SIG-06-060-0-025");
        pc(dehesafuentes, "06060A0020008500000SC", 48.0f, "PR", "SE", "Almendralejo");
        pc(dehesafuentes, "06060A0020008600000SC", 47.0f, "PR", "SE", "Almendralejo");

        inv(pilar, cobre,       "Repaso olivo — Alquería",          24.0f);
        inv(pilar, glifosato,   "Herbicida suelo olivar seco",      16.0f);
        inv(pilar, clorpirifos, "Mosca olivo — Fuentes",            13.0f);
        inv(pilar, abamectina,  "Acaricida olivo Pilar",             5.0f);
        inv(pilar, captan,      "Fungicida preventivo cereal Pilar",  7.5f);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private Granjero g(String username) {
        return granjeroRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Granjero no encontrado: " + username));
    }

    private Explotacion exp(Asesoria a, Granjero g, String nombre, String orientacion, float ha, String refSig) {
        return explotacionRepository.save(Explotacion.builder()
                .nombre(nombre)
                .orientacionProductiva(orientacion)
                .superficieTotal(BigDecimal.valueOf(ha))
                .refSig(refSig)
                .estado("ACTIVA")
                .asesoria(a)
                .granjero(g)
                .build());
    }

    /** Crea una Parcela y un Recinto por defecto (recinto 1) con cultivo y superficie SIGPAC. */
    private void pc(Explotacion e, String refCatastral, float superficie, String codigoCultivo,
                    String sistemaCultivo, String municipio) {
        Parcela parcela = parcelaRepository.save(Parcela.builder()
                .refCatastral(refCatastral)
                .municipio(municipio)
                .explotacion(e)
                .build());

        recintoRepository.save(Recinto.builder()
                .numeroRecinto(1)
                .superficie(BigDecimal.valueOf(superficie))
                .usoSigpac(codigoCultivo)
                .sistemaCultivo(sistemaCultivo)
                .cultivo(codigoCultivo)
                .parcela(parcela)
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
}
