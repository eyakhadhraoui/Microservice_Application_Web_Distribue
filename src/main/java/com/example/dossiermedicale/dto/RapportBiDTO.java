package com.example.dossiermedicale.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RapportBiDTO {

    private Long idRapportBilan;

    /** Historique : un seul résultat (optionnel si resultatsIds est utilisé). */
    private Long idResultatLaboratoire;

    /** Liste des IDs des résultats inclus dans ce rapport (relation Rapport → ResultatLaboratoire). */
    private List<Long> resultatsIds;

    @NotNull(message = "L'ID du dossier médical est obligatoire")
    private Long idDossierMedical;

    @NotNull(message = "La date du rapport est obligatoire")
    @PastOrPresent(message = "La date ne peut pas être dans le futur")
    private LocalDate dateRapport;

    private String contenu;
    private String conclusion;
    private String recommandations;
    private String cheminPdf;
    private String signatureBase64;
    private LocalDateTime dateSignature;
    private String nomMedecin;

    /** La famille peut-elle voir ce rapport ? */
    private Boolean partagePatient;
}
