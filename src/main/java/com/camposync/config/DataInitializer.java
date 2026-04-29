package com.camposync.config;

import com.camposync.entity.Asesoria;
import com.camposync.entity.Plan;
import com.camposync.repository.AsesoriaRepository;
import com.camposync.repository.PlanRepository;
import com.camposync.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final PlanRepository planRepository;
    private final AsesoriaRepository asesoriaRepository;
    private final AuthService authService;

    @Override
    public void run(String... args) {
        if (planRepository.count() > 0) {
            log.info("Base de datos ya inicializada, omitiendo seed.");
            return;
        }

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

        authService.registerAsesor("admin", "admin123", asesoria.getId(), true);
        authService.registerGranjero("granjero1", "granjero123", "LEG-001");

        log.info("Datos de prueba creados:");
        log.info("  Asesor  → usuario: admin      / pass: admin123");
        log.info("  Granjero → usuario: granjero1  / pass: granjero123");
    }
}
