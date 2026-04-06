package com.example.dossiermedicale.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Événement calendrier pour le patient : suivi ou image médicale ajouté(e) par le médecin.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalendrierEventDTO {

    public enum TypeEvent {
        SUIVI,
        IMAGE_MEDICALE
    }

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate date;
    private TypeEvent type;
    /** Titre affiché (ex: "Suivi — Amélioration", "Échographie rénale"). */
    private String titre;
    /** ID de l'entité (idSuivi ou idImage). */
    private Long id;
    private Long idDossierMedical;
    /** Optionnel : description courte. */
    private String description;
}
