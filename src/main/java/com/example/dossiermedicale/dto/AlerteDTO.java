package com.example.dossiermedicale.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Alerte "aucun suivi depuis N jours" pour un dossier.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlerteDTO {

    private Long idDossierMedical;
    private Long idPatient;
    private Long idMedecin;
    private LocalDate dateDernierSuivi;
    private long joursSansSuivi;
    private String libelle;
}
