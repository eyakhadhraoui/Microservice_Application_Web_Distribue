package com.example.prescription_Service.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionItemDTO {

    private Long id;

    @NotNull(message = "L'ID de la prescription est obligatoire")
    private Long prescriptionId;

    @NotNull(message = "L'ID du médicament est obligatoire")
    private Long medicationId;

    @NotNull(message = "Les instructions de dosage sont obligatoires")
    private String dosageInstructions;

    @NotNull(message = "La fréquence est obligatoire")
    private String frequency;

    @Positive(message = "La durée doit être positive")
    private Integer duration;

    @NotNull(message = "La voie d'administration est obligatoire")
    private String administrationRoute;

    @NotNull(message = "La date de début est obligatoire")
    private LocalDate startDate;

    @NotNull(message = "La date de fin est obligatoire")
    private LocalDate endDate;

    private String specialInstructions;

    @NotNull(message = "La priorité est obligatoire")
    private Boolean isPriority;

    // ✅ NOUVEAU
    private Boolean isImmunosuppressor;

    // ✅ NOUVEAU — Horaires envoyés depuis le frontend
    private List<LocalTime> scheduledTimes;

    // Infos médicament (lecture seule)
    private String medicationName;
    private String medicationCategory;
    private String medicationDosage;
    private String medicationUnit;
}