package com.example.dossiermedicale.Entities;

import com.example.dossiermedicale.Enum.InterpretationResultat;
import com.example.dossiermedicale.Enum.SourceImport;
import com.example.dossiermedicale.Enum.StatutResultat;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Instance d'un test pour un patient donné.
 * idTestLaboratoire (FK) obligatoire — quel test a produit ce résultat.
 * Dates séparées (datePrelevement, dateRendu), valeur numérique + texte, statut + interprétation, source, validation.
 */
@Entity
@Table(name = "resultat_laboratoire")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResultatLaboratoire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idResultatLaboratoire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idDossierMedical", nullable = false)
    private DossierMedical dossierMedical;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idTestLaboratoire", nullable = false)
    private TestLaboratoire testLaboratoire;

    /** Date/heure du prélèvement. */
    @Column(name = "date_prelevement")
    private LocalDateTime datePrelevement;

    /** Date/heure de rendu par le labo. */
    @Column(name = "date_rendu")
    private LocalDateTime dateRendu;

    /** Pour compatibilité : préférer datePrelevement/dateRendu. */
    @Column
    private LocalDate dateResultat;

    /** Valeur numérique — courbes, comparaisons (remplace valeurResultat:String). */
    @Column(name = "valeur_numerique")
    private Double valeurNumerique;

    /** Pour résultats qualitatifs (Positif/Négatif/Traces). */
    @Column(name = "valeur_texte", length = 100)
    private String valeurTexte;

    /** Déprécié : utiliser valeurNumerique + valeurTexte. Conservé pour migration. */
    @Deprecated
    @Column(length = 500)
    private String valeurResultat;

    @Column(length = 20)
    private String unite;

    @Column(columnDefinition = "TEXT")
    private String conclusion;

    /** EN_ATTENTE / RECU / VALIDE — remplace le champ vague "etat". */
    @Enumerated(EnumType.STRING)
    @Column(name = "statut_resultat", length = 20)
    private StatutResultat statutResultat;

    /** NORMAL / ELEVE / BAS / CRITIQUE_HAUT / CRITIQUE_BAS. */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private InterpretationResultat interpretation;

    /** HL7 / PDF_OCR / SAISIE_MANUELLE / LABO_CONNECTE. */
    @Enumerated(EnumType.STRING)
    @Column(name = "source_import", length = 20)
    private SourceImport sourceImport;

    /** FK Médecin — null si non encore validé. */
    @Column(name = "valide_par_medecin")
    private Long valideParMedecin;

    @Column(name = "date_validation")
    private LocalDateTime dateValidation;

    /** La famille peut-elle voir ce résultat ? */
    @Column(name = "partage_patient", nullable = false)
    @Builder.Default
    private Boolean partagePatient = false;

    /** Déprécié : utiliser statutResultat + interpretation. */
    @Deprecated
    @Column(length = 50)
    private String etat;
}
