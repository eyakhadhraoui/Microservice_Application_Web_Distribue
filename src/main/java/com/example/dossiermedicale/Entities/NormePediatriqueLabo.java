package com.example.dossiermedicale.Entities;

import com.example.dossiermedicale.Enum.SexeNorme;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Normes pédiatriques par âge (mois) et sexe pour l'interprétation automatique (SFN, KDIGO, etc.).
 */
@Entity
@Table(name = "norme_pediatrique_labo", indexes = {
    @Index(name = "idx_norme_loinc_age_sexe", columnList = "code_loinc, age_min_mois, age_max_mois, sexe")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NormePediatriqueLabo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code_loinc", nullable = false, length = 20)
    private String codeLoinc;

    @Column(name = "age_min_mois", nullable = false)
    private Integer ageMinMois;

    @Column(name = "age_max_mois", nullable = false)
    private Integer ageMaxMois;

    @Column(name = "poids_min_kg", precision = 6, scale = 2)
    private BigDecimal poidsMinKg;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private SexeNorme sexe;

    @Column(name = "valeur_min_normale", precision = 12, scale = 4)
    private BigDecimal valeurMinNormale;

    @Column(name = "valeur_max_normale", precision = 12, scale = 4)
    private BigDecimal valeurMaxNormale;

    @Column(name = "seuil_critique_bas", precision = 12, scale = 4)
    private BigDecimal seuilCritiqueBas;

    @Column(name = "seuil_critique_haut", precision = 12, scale = 4)
    private BigDecimal seuilCritiqueHaut;

    @Column(name = "source_reference", length = 100)
    private String sourceReference;
}
