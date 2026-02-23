package com.example.NEPHRO.dto;

import com.example.NEPHRO.Enum.StatutSuivi;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SuiviDTO {

    private Long idSuivi;

    @NotNull(message = "L'ID du dossier médical est obligatoire")
    private Long idDossierMedical;

    @NotNull(message = "La date de suivi est obligatoire")
    @PastOrPresent(message = "La date de suivi ne peut pas être dans le futur")
    private LocalDate dateSuivi;

    private String notes;

    private String objectif;

    @NotNull(message = "Le statut/résultat est obligatoire")
    private StatutSuivi resultat;
}

