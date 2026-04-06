package com.example.dossiermedicale.dto;

import com.example.dossiermedicale.Enum.InterpretationResultat;
import com.example.dossiermedicale.Enum.SourceImport;
import com.example.dossiermedicale.Enum.StatutResultat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResultatLaboratoireDTO {

    private Long idResultatLaboratoire;

    private Long idDossierMedical;
    private Long idTestLaboratoire;

    private LocalDateTime datePrelevement;
    private LocalDateTime dateRendu;
    private LocalDate dateResultat;

    /** Valeur numérique — courbes, comparaisons. */
    private Double valeurNumerique;
    /** Résultats qualitatifs (Positif/Négatif/Traces). */
    private String valeurTexte;
    /** Déprécié : préférer valeurNumerique + valeurTexte. */
    private String valeurResultat;

    private String unite;
    private String conclusion;

    private StatutResultat statutResultat;
    private InterpretationResultat interpretation;
    private SourceImport sourceImport;

    private Long valideParMedecin;
    private LocalDateTime dateValidation;

    private Boolean partagePatient;

    @Deprecated
    private String etat;

    /** Remplis par le service (affichage). */
    private String nomTest;
    private String codeTest;
}
