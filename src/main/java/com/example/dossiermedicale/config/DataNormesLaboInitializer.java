package com.example.dossiermedicale.config;

import com.example.dossiermedicale.Entities.NormePediatriqueLabo;
import com.example.dossiermedicale.Enum.SexeNorme;
import com.example.dossiermedicale.Repository.NormePediatriqueLaboRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * Remplit norme_pediatrique_labo avec des valeurs de référence type SFN (Société Française de Néphrologie)
 * pour créatinine, urée, kaliémie, natrémie, protéinurie, bicarbonates, DFG, hémoglobine.
 * 6 tranches d'âge (0-6, 6-12, 12-24, 24-60, 60-120, 120-216 mois) × M/F ou TOUS.
 * Exécuté au démarrage si la table est vide.
 */
@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class DataNormesLaboInitializer implements ApplicationRunner {

    private final NormePediatriqueLaboRepository repository;

    @Override
    public void run(ApplicationArguments args) {
        if (repository.count() > 0) {
            log.debug("Normes pédiatriques déjà présentes, skip init.");
            return;
        }
        log.info("Initialisation des normes pédiatriques labo (SFN / KDIGO Pediatric)...");
        List<NormePediatriqueLabo> normes = List.of(
                // Créatinine (µmol/L) — LOINC 2160-0
                norme("2160-0", 0, 6, SexeNorme.TOUS, 15, 35, 10, 80, "SFN"),
                norme("2160-0", 6, 12, SexeNorme.TOUS, 20, 40, 12, 90, "SFN"),
                norme("2160-0", 12, 24, SexeNorme.TOUS, 25, 45, 15, 100, "SFN"),
                norme("2160-0", 24, 60, SexeNorme.TOUS, 30, 55, 18, 120, "SFN"),
                norme("2160-0", 60, 120, SexeNorme.TOUS, 40, 70, 25, 150, "SFN"),
                norme("2160-0", 120, 216, SexeNorme.M, 50, 90, 30, 180, "SFN"),
                norme("2160-0", 120, 216, SexeNorme.F, 45, 80, 28, 160, "SFN"),
                // Urée (mmol/L) — LOINC 3094-0
                norme("3094-0", 0, 6, SexeNorme.TOUS, 1.5, 6.0, 1.0, 15.0, "SFN"),
                norme("3094-0", 6, 24, SexeNorme.TOUS, 2.0, 6.5, 1.2, 16.0, "SFN"),
                norme("3094-0", 24, 120, SexeNorme.TOUS, 2.5, 7.0, 1.5, 18.0, "SFN"),
                norme("3094-0", 120, 216, SexeNorme.TOUS, 3.0, 7.5, 2.0, 20.0, "SFN"),
                // Kaliémie (mmol/L) — 2823-3
                norme("2823-3", 0, 216, SexeNorme.TOUS, 3.5, 5.5, 2.5, 6.5, "SFN"),
                // Natrémie (mmol/L) — 2951-2
                norme("2951-2", 0, 216, SexeNorme.TOUS, 135, 145, 125, 155, "SFN"),
                // Protéinurie (g/g créat) — 2888-6
                norme("2888-6", 0, 216, SexeNorme.TOUS, 0, 0.2, null, 3.0, "SFN"),
                // Bicarbonates (mmol/L) — 1963-8
                norme("1963-8", 0, 216, SexeNorme.TOUS, 22, 28, 15, 35, "SFN"),
                // DFG estimé (mL/min/1.73m²) — 33914-3
                norme("33914-3", 0, 24, SexeNorme.TOUS, 40, 120, 30, null, "KDIGO Pediatric"),
                norme("33914-3", 24, 120, SexeNorme.TOUS, 80, 120, 30, null, "KDIGO Pediatric"),
                norme("33914-3", 120, 216, SexeNorme.TOUS, 90, 120, 30, null, "KDIGO Pediatric"),
                // Hémoglobine (g/L) — 718-7
                norme("718-7", 0, 6, SexeNorme.TOUS, 95, 140, 70, 180, "SFN"),
                norme("718-7", 6, 24, SexeNorme.TOUS, 105, 135, 75, 160, "SFN"),
                norme("718-7", 24, 120, SexeNorme.TOUS, 115, 140, 80, 160, "SFN"),
                norme("718-7", 120, 216, SexeNorme.M, 130, 170, 90, 180, "SFN"),
                norme("718-7", 120, 216, SexeNorme.F, 120, 155, 90, 170, "SFN")
        );
        repository.saveAll(normes);
        log.info("Normes pédiatriques labo initialisées: {} entrées.", normes.size());
    }

    private static NormePediatriqueLabo norme(String codeLoinc, int ageMin, int ageMax, SexeNorme sexe,
                                               Number minN, Number maxN, Number critBas, Number critHaut, String source) {
        return NormePediatriqueLabo.builder()
                .codeLoinc(codeLoinc)
                .ageMinMois(ageMin)
                .ageMaxMois(ageMax)
                .sexe(sexe)
                .valeurMinNormale(minN != null ? BigDecimal.valueOf(minN.doubleValue()) : null)
                .valeurMaxNormale(maxN != null ? BigDecimal.valueOf(maxN.doubleValue()) : null)
                .seuilCritiqueBas(critBas != null ? BigDecimal.valueOf(critBas.doubleValue()) : null)
                .seuilCritiqueHaut(critHaut != null ? BigDecimal.valueOf(critHaut.doubleValue()) : null)
                .sourceReference(source)
                .build();
    }
}
