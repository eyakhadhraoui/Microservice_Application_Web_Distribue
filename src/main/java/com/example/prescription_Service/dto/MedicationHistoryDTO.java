package com.example.prescription_Service.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MedicationHistoryDTO {

    private Long id;

    private Long prescriptionItemId;

    private Long patientId;

    private LocalDateTime takenAt;

    private String status;

    private String actualDosage;
    private String notes;
    private String administeredBy;
    private String sideEffects;
    private Double temperature;
    private String vitalSigns;

    private String medicationName;
    private String medicationCategory;
    private String dosageInstructions;
    private Long prescriptionId;
}