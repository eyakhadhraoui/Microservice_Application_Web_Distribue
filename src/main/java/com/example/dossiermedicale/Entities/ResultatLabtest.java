package com.example.dossiermedicale.Entities;

import com.example.dossiermedicale.Enum.SourceResultat;
import com.example.dossiermedicale.Enum.StatutInterpretation;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Résultat d'un examen de laboratoire : valeur, unité, source (HL7, OCR, saisie), interprétation auto.
 * prescription_id peut être NULL : résultat sans prescription (famille aux urgences avec bilan d'un autre hôpital,
 * ou import manuel d'un ancien bilan).
 */
@Entity
@Table(name = "resultat_labtest")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResultatLabtest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Null si résultat sans prescription (ex. bilan externe importé, urgences). */
    @Column(name = "prescription_id")
    private Long prescriptionId;

    @Column(name = "dossier_id", nullable = false)
    private Long dossierId;

    @Column(name = "code_loinc", nullable = false, length = 20)
    private String codeLoinc;

    @Column(name = "libelle_examen", length = 100)
    private String libelleExamen;

    @Column(precision = 10, scale = 4)
    private BigDecimal valeur;

    @Column(length = 20)
    private String unite;

    @Column(name = "date_prelevement")
    private LocalDateTime datePrelevement;

    @Column(name = "date_rendu")
    private LocalDateTime dateRendu;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private SourceResultat source;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut_interpretation", length = 20)
    private StatutInterpretation statutInterpretation;

    /** ID du médecin ayant validé ce résultat (null = non validé). */
    @Column(name = "valide_par_medecin")
    private Long valideParMedecin;
}
