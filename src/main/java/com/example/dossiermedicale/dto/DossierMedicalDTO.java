package com.example.dossiermedicale.dto;

import com.example.dossiermedicale.Enum.Diagnostic;
import jakarta.validation.constraints.PastOrPresent;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DossierMedicalDTO {

    private Long idDossierMedical;

    @NotNull(message = "L'ID du patient est obligatoire")
    private Long idPatient;

    @NotNull(message = "La date de création est obligatoire")
    @PastOrPresent(message = "La date de création ne peut pas être dans le futur")
    private LocalDate dateCreation;

    @NotNull(message = "L'ID du médecin est obligatoire")
    private Long idMedecin;

    @NotNull(message = "Le diagnostic est obligatoire")
    private Diagnostic diagnostic;

    private String notes;

    /** Poids (kg) — ex-ParametreVital. */
    private java.math.BigDecimal poids;
    /** Taille (cm) — ex-ParametreVital. */
    private java.math.BigDecimal taille;
    /** IMC — ex-ParametreVital. */
    private java.math.BigDecimal imc;

    /** Affichage : nom du patient (Prénom Nom). */
    private String patientNom;
    /** Affichage : nom du médecin (Dr. Nom Prénom). */
    private String medecinNom;
}