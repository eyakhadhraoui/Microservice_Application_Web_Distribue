package com.example.dossiermedicale.Entities;

import jakarta.persistence.*;
import lombok.*;

/**
 * Catalogue des examens disponibles — pas les résultats. Un résultat est une instance d'un test.
 * Les normes (valeurs par âge/sexe) sont dans NormePediatriqueLabo / ConstanteVitale.
 */
@Entity
@Table(name = "test_laboratoire")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestLaboratoire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idTestLaboratoire;

    @Column(nullable = false, unique = true, length = 50)
    private String codeTest;

    /** Code LOINC standard international (ex: 2160-0). */
    @Column(name = "code_loinc", length = 20)
    private String codeLoinc;

    @Column(nullable = false, length = 255)
    private String nomTest;

    @Column(length = 100)
    private String categorie;

    /** Sang, Urine 24h, Urine spot, Calculé. */
    @Column(name = "type_echantillon", length = 50)
    private String typeEchantillon;

    @Column(length = 50)
    private String unite;

    /** Supprimé du schéma : les normes sont dans NormePediatriqueLabo (âge, sexe). Conservé pour migration. */
    @Deprecated
    @Column(columnDefinition = "TEXT")
    private String valeursNormales;

    @Column(length = 255)
    private String methodeAnalyse;

    private Double prix;

    /** Délai normal de rendu en heures (ex: 4, 24, 48). */
    @Column(name = "delai_rendu_heures")
    private Integer delaiRenduHeures;

    /** Important en pédiatrie. */
    @Column(name = "necessite_jeune", nullable = false)
    @Builder.Default
    private Boolean necessiteJeune = false;
}
